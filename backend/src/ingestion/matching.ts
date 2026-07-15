import { historiquePourTransfert, ajouterHistorique } from '../repo/historique.repo.js';
import { upsertSource } from '../repo/sources.repo.js';
import { findTransfertByCle, getTransfert, insererTransfert, mettreAJourStatut } from '../repo/transferts.repo.js';
import { recalculerScoreTransfert, resoudreTransfert } from '../domain/cascade.js';
import { STATUT_STEP } from '../domain/statutMapping.js';
import type { LeagueId, Origine, SourceCategorie, Statut } from '../types.js';

/**
 * Clé de dédoublonnage heuristique — fait correspondre une même transaction
 * réelle vue par deux fournisseurs différents (ex: rumeur SportMonks puis
 * confirmation API-Football) via joueur+clubs+fenêtre normalisés. Approximation
 * documentée : un homonyme exact sur les mêmes clubs dans la même fenêtre
 * fusionnerait à tort (cas extrêmement rare en pratique dans les Big 5).
 */
export function cleCorrespondance(joueur: string, clubSortantId: number | null, clubEntrantId: number | null, fenetreId: string): string {
  const norm = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return `${norm(joueur)}|${clubSortantId ?? '?'}|${clubEntrantId ?? '?'}|${fenetreId}`;
}

export interface CitationEntrante {
  joueur: string;
  clubSortantId: number | null;
  clubEntrantId: number | null;
  championnatId: LeagueId;
  fenetreId: string;
  statutPropose: Statut;
  montant: string | null;
  date: string;
  sourceNom: string;
  sourceCategorie: SourceCategorie;
  origine: Origine;
  lienSource?: string | null;
}

/**
 * Enregistre une citation (rumeur ou confirmation) reçue d'un fournisseur.
 * Crée le transfert s'il n'existe pas, ajoute l'entrée d'historique, et
 * recalcule son score — sans jamais faire régresser un statut déjà plus
 * avancé, ni rouvrir un transfert déjà résolu (officiel/annulé).
 */
export async function enregistrerCitation(c: CitationEntrante): Promise<number> {
  const cle = cleCorrespondance(c.joueur, c.clubSortantId, c.clubEntrantId, c.fenetreId);
  let transfert = await findTransfertByCle(cle);

  if (!transfert) {
    transfert = await insererTransfert({
      joueur: c.joueur,
      clubSortantId: c.clubSortantId,
      clubEntrantId: c.clubEntrantId,
      championnatId: c.championnatId,
      fenetreId: c.fenetreId,
      statut: c.statutPropose,
      scoreFiabilite: null,
      montant: c.montant,
      dateTransfert: c.statutPropose === 'officiel' ? c.date : null,
      cleCorrespondance: cle,
    });
  }

  if (transfert.statut === 'officiel' || transfert.statut === 'annule') {
    return transfert.id; // déjà résolu — une nouvelle rumeur tardive ne rouvre rien
  }

  const source = await upsertSource(c.sourceNom, c.sourceCategorie);
  const estPrimaire = (await historiquePourTransfert(transfert.id)).length === 0;
  await ajouterHistorique({
    transfertId: transfert.id,
    statut: c.statutPropose,
    date: c.date,
    sourceId: source.id,
    estPrimaire,
    origine: c.origine,
    lienSource: c.lienSource,
  });

  if (c.statutPropose === 'officiel' || c.statutPropose === 'annule') {
    await resoudreTransfert({ transfertId: transfert.id, resolution: c.statutPropose, date: c.date, sourceId: source.id, origine: c.origine, lienSource: c.lienSource });
  } else {
    // Ne fait avancer le statut affiché que si la nouvelle citation est plus avancée que l'actuel.
    const actuel = (await getTransfert(transfert.id))!;
    if (actuel.statut !== 'officiel' && actuel.statut !== 'annule') {
      const stepActuel = STATUT_STEP[actuel.statut];
      const stepPropose = STATUT_STEP[c.statutPropose as Exclude<Statut, 'annule'>];
      if (stepPropose > stepActuel) {
        await mettreAJourStatut(transfert.id, c.statutPropose, actuel.score_fiabilite);
      }
    }
    await recalculerScoreTransfert(transfert.id);
  }

  return transfert.id;
}
