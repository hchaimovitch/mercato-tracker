import { fenetrePourDate } from '../repo/fenetres.repo.js';
import { listerClubsBig5, trouverClubBig5ParNom } from '../repo/clubs.repo.js';
import { getEtat, setEtat } from '../repo/syncState.repo.js';
import { statutDepuisProbabilite } from '../domain/statutMapping.js';
import { enregistrerCitation } from './matching.js';
import { categoriserSource } from './sourceCategorization.js';
import { FLUX_RSS, telechargerFlux } from './rssRumeurs.client.js';
import { extraireRumeur, isClaudeActif } from './rssRumeurs.claude.js';
import { ALIASES_LITTERAUX, resoudreAliasClub } from './clubAliases.js';
import type { LeagueId } from '../types.js';

const cleEtat = (nomFlux: string) => `rss_derniere_maj:${nomFlux}`;

function echapperRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Complète les rumeurs SportMonks (optionnel/payant) par 2 flux RSS publics
 * analysés via Claude Haiku — voir README pour le coût estimé et les limites.
 * Filtre par nom de club Big 5 avant tout appel Claude (voir citeUnClubBig5
 * ci-dessous) pour ne jamais payer un appel LLM sur un article hors sujet.
 */
export async function synchroniserRumeursRss(): Promise<void> {
  if (!isClaudeActif()) {
    console.log('[rss-rumeurs] désactivé (ANTHROPIC_API_KEY absente)');
    return;
  }

  const clubsBig5 = await listerClubsBig5();
  const regexClubs = [
    ...clubsBig5.map((c) => new RegExp(`\\b${echapperRegex(c.nom)}\\b`, 'i')),
    ...ALIASES_LITTERAUX.map((a) => new RegExp(`\\b${echapperRegex(a)}\\b`, 'i')),
  ];
  const citeUnClubBig5 = (texte: string) => regexClubs.some((r) => r.test(texte));

  let candidats = 0;
  let analyses = 0;
  let retenues = 0;

  for (const flux of FLUX_RSS) {
    let articles;
    try {
      articles = await telechargerFlux(flux.url);
    } catch (err) {
      console.error(`[rss-rumeurs] échec de téléchargement du flux ${flux.nom} :`, err);
      continue;
    }

    // Sans état précédent (premier passage), on ne remonte que 24h en arrière —
    // évite une rafale d'appels Claude sur tout l'historique du flux au démarrage.
    const derniereMaj = await getEtat(cleEtat(flux.nom));
    const seuil = derniereMaj ?? new Date(Date.now() - 24 * 3_600_000).toISOString();
    const nouveaux = articles
      .filter((a) => a.datePublication > seuil)
      .sort((a, b) => a.datePublication.localeCompare(b.datePublication));

    for (const article of nouveaux) {
      const texte = `${article.titre} ${article.extrait}`;
      if (!citeUnClubBig5(texte)) continue;
      candidats++;

      let extraction;
      try {
        extraction = await extraireRumeur(article.titre, article.extrait);
      } catch (err) {
        console.error(`[rss-rumeurs] échec d'extraction Claude pour "${article.titre}" :`, err);
        continue;
      }
      analyses++;
      if (!extraction || !extraction.estTransfert || !extraction.joueur || !extraction.probabilite) continue;

      const clubEntrant = extraction.clubArrivee ? await trouverClubBig5ParNom(resoudreAliasClub(extraction.clubArrivee)) : undefined;
      const clubSortant = extraction.clubDepart ? await trouverClubBig5ParNom(resoudreAliasClub(extraction.clubDepart)) : undefined;
      if (!clubEntrant && !clubSortant) continue; // ni club connu ni correspondance de nom — on ignore plutôt que de deviner

      const dateArticle = article.datePublication.slice(0, 10);
      const fenetre = await fenetrePourDate(dateArticle);
      if (!fenetre) continue;

      const championnatId = (clubEntrant ?? clubSortant)!.championnat_id as LeagueId;

      await enregistrerCitation({
        joueur: extraction.joueur,
        clubSortantId: clubSortant?.id ?? null,
        clubEntrantId: clubEntrant?.id ?? null,
        championnatId,
        fenetreId: fenetre.id,
        statutPropose: statutDepuisProbabilite(extraction.probabilite),
        montant: null,
        date: dateArticle,
        sourceNom: flux.nom,
        sourceCategorie: categoriserSource(flux.nom),
        origine: 'automatique_api',
        lienSource: article.lien,
      });
      retenues++;
    }

    if (nouveaux.length > 0) {
      await setEtat(cleEtat(flux.nom), nouveaux[nouveaux.length - 1].datePublication);
    }
  }

  console.log(
    `[rss-rumeurs] ${retenues} rumeur(s) retenue(s) sur ${analyses} article(s) analysés par Claude ` +
    `(${candidats} candidat(s) après filtre par nom de club)`
  );
}
