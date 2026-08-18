import { gunzipSync } from 'node:zlib';
import { parse } from 'csv-parse/sync';
import { fenetrePourDate } from '../repo/fenetres.repo.js';
import { getClub, listerClubsBig5, listerTousLesClubs, normaliserNomClub } from '../repo/clubs.repo.js';
import { listerTransfertsSansMontant, mettreAJourMontant } from '../repo/transferts.repo.js';
import { enregistrerCitation } from './matching.js';
import type { LeagueId } from '../types.js';

/**
 * Jeu de données CC0-1.0 publié par https://github.com/dcaribou/transfermarkt-datasets
 * (scraping + republication déjà faits par ce tiers, rafraîchis chaque semaine par leur
 * propre pipeline). On ne fait ici que télécharger un fichier déjà publié — aucune requête
 * n'est jamais envoyée à transfermarkt.com depuis ce backend.
 *
 * Sert à deux choses : (1) créer les transferts officiels qu'API-Football ne fournit
 * pas ou plus (compte suspendu au moment où ce module est écrit — voir README), et
 * (2) compléter le montant des transferts déjà connus par ailleurs. Les deux tournent
 * en parallèle sans créer de doublons quand un même transfert est vu par API-Football
 * ET Transfermarkt (voir trouverTransfertApprochant dans matching.ts, qui absorbe les
 * différences de format de nom entre fournisseurs).
 */
const URL_TRANSFERTS = 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/transfers.csv.gz';

interface LigneTransfermarkt {
  playerName: string;
  transferDate: string;
  fromClubName: string;
  toClubName: string;
  transferFeeEur: number | null;
}

function normaliserTexte(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Clé de correspondance joueur : le nom de famille seul, pas le nom complet.
 * API-Football abrège systématiquement le prénom en initiale ("A. Cozier-Duberry"),
 * alors que Transfermarkt utilise le prénom complet ("Archie Cozier-Duberry") — une
 * comparaison sur le nom complet ne matchait quasiment jamais (vérifié sur un
 * échantillon en prod). Le nom de famille est désambiguïsé par le club juste après.
 */
function cleJoueur(nomComplet: string): string {
  const tokens = nomComplet.trim().split(/\s+/);
  return normaliserTexte(tokens[tokens.length - 1]);
}

function formatMontant(feeEur: number): string {
  if (feeEur === 0) return 'Libre';
  return `€${(feeEur / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

async function telechargerLignes(): Promise<LigneTransfermarkt[]> {
  const res = await fetch(URL_TRANSFERTS);
  if (!res.ok) throw new Error(`téléchargement du dataset échoué : HTTP ${res.status}`);
  const gz = Buffer.from(await res.arrayBuffer());
  const csv = gunzipSync(gz).toString('utf-8');
  const lignes: Record<string, string>[] = parse(csv, { columns: true, skip_empty_lines: true });

  // Garde aussi les lignes à montant inconnu (transfer_fee vide) : les exclure ici les
  // rendait invisibles à la correspondance par joueur+club, alors qu'on doit pouvoir
  // distinguer "transfert introuvable" de "transfert trouvé mais montant inconnu chez
  // Transfermarkt aussi" (vérifié sur un échantillon en prod — des candidats plausibles
  // disparaissaient silencieusement à cause de ce filtre).
  return lignes.map((l) => ({
    playerName: l.player_name,
    transferDate: l.transfer_date,
    fromClubName: l.from_club_name,
    toClubName: l.to_club_name,
    transferFeeEur: l.transfer_fee === '' || l.transfer_fee === undefined ? null : Number(l.transfer_fee),
  })).filter((l) => l.playerName);
}

/**
 * Crée les transferts officiels absents de la base à partir des lignes qui concernent
 * un club Big 5. Ne retient une ligne que si l'autre club (sortant ou entrant) est déjà
 * identifiable dans notre table clubs (Big 5 ou déjà connu hors Big 5 via API-Football) —
 * s'il ne l'est pas, on ignore plutôt que d'inventer un club à partir du seul nom
 * Transfermarkt (pas d'id fiable pour lui donner un logo, risque de doublon avec un club
 * déjà créé sous un nom légèrement différent).
 */
async function creerTransfertsOfficiels(lignes: LigneTransfermarkt[]): Promise<void> {
  const clubsBig5 = await listerClubsBig5();
  const clubsTous = await listerTousLesClubs();
  const indexBig5 = new Map(clubsBig5.map((c) => [normaliserNomClub(c.nom), c]));
  const indexTous = new Map(clubsTous.map((c) => [normaliserNomClub(c.nom), c]));

  let traites = 0;
  let ignoresAutreClubInconnu = 0;
  let ignoresHorsFenetre = 0;
  const echantillonAutreClubInconnu: { joueur: string; from: string; to: string }[] = [];

  for (const l of lignes) {
    const sortantBig5 = indexBig5.get(normaliserNomClub(l.fromClubName));
    const entrantBig5 = indexBig5.get(normaliserNomClub(l.toClubName));
    if (!sortantBig5 && !entrantBig5) continue; // aucun club Big 5 des deux côtés, hors sujet

    const clubSortant = sortantBig5 ?? indexTous.get(normaliserNomClub(l.fromClubName));
    const clubEntrant = entrantBig5 ?? indexTous.get(normaliserNomClub(l.toClubName));
    if (!clubSortant || !clubEntrant) {
      ignoresAutreClubInconnu++;
      if (echantillonAutreClubInconnu.length < 15) {
        echantillonAutreClubInconnu.push({ joueur: l.playerName, from: l.fromClubName, to: l.toClubName });
      }
      continue;
    }

    const fenetre = await fenetrePourDate(l.transferDate);
    if (!fenetre) { ignoresHorsFenetre++; continue; }

    const championnatId = (entrantBig5 ?? sortantBig5)!.championnat_id as LeagueId;

    await enregistrerCitation({
      joueur: l.playerName,
      clubSortantId: clubSortant.id,
      clubEntrantId: clubEntrant.id,
      championnatId,
      fenetreId: fenetre.id,
      statutPropose: 'officiel',
      montant: l.transferFeeEur !== null ? formatMontant(l.transferFeeEur) : null,
      date: l.transferDate,
      sourceNom: 'Transfermarkt (dataset)',
      sourceCategorie: 'media_generaliste',
      origine: 'automatique_api',
    });
    traites++;
  }

  console.log(
    `[transfermarkt-dataset] officiels : ${traites} transfert(s) Big 5 traité(s) sur ${lignes.length} lignes du dataset ` +
    `(${ignoresAutreClubInconnu} avec l'autre club non identifié, ${ignoresHorsFenetre} hors fenêtre suivie)`
  );
  if (echantillonAutreClubInconnu.length > 0) {
    console.log(`[transfermarkt-dataset] échantillon de clubs non identifiés (officiels) : ${JSON.stringify(echantillonAutreClubInconnu)}`);
  }
}

/**
 * Complète le montant des transferts déjà enregistrés qui n'en ont pas.
 * Correspondance par nom de famille du joueur (voir cleJoueur), désambiguïsée par le nom du
 * club (dans un sens ou l'autre) car Transfermarkt utilise son propre espace d'identifiants,
 * sans lien avec ceux d'API-Football. Comme pour la correspondance SportMonks : en cas de
 * doute (plusieurs candidats, aucun club qui corresponde), on ignore plutôt que de risquer un
 * mauvais montant.
 */
async function completerMontants(lignes: LigneTransfermarkt[]): Promise<void> {
  const sansMontant = await listerTransfertsSansMontant();
  if (sansMontant.length === 0) {
    console.log('[transfermarkt-dataset] montants : rien à compléter');
    return;
  }

  const parJoueur = new Map<string, LigneTransfermarkt[]>();
  for (const l of lignes) {
    const cle = cleJoueur(l.playerName);
    const groupe = parJoueur.get(cle);
    if (groupe) groupe.push(l);
    else parJoueur.set(cle, [l]);
  }

  let completes = 0;
  let aucunJoueur = 0;
  let aucunClub = 0;
  let ambigu = 0;
  let montantInconnuCoteSource = 0;
  const echantillonAucunJoueur: string[] = [];
  const echantillonAucunClub: { joueur: string; nosClubs: string; candidats: string }[] = [];
  const completions: { joueur: string; montant: string }[] = [];
  for (const t of sansMontant) {
    const candidats = parJoueur.get(cleJoueur(t.joueur));
    if (!candidats || candidats.length === 0) {
      aucunJoueur++;
      if (echantillonAucunJoueur.length < 15) echantillonAucunJoueur.push(t.joueur);
      continue;
    }

    const nomSortant = t.club_sortant_id ? (await getClub(t.club_sortant_id))?.nom : undefined;
    const nomEntrant = t.club_entrant_id ? (await getClub(t.club_entrant_id))?.nom : undefined;
    const cibleSortant = nomSortant ? normaliserTexte(nomSortant) : undefined;
    const cibleEntrant = nomEntrant ? normaliserTexte(nomEntrant) : undefined;

    const correspondants = candidats.filter((c) => {
      const from = normaliserTexte(c.fromClubName);
      const to = normaliserTexte(c.toClubName);
      return (cibleSortant && from === cibleSortant) || (cibleEntrant && to === cibleEntrant);
    });
    if (correspondants.length === 0) {
      aucunClub++;
      if (echantillonAucunClub.length < 15) {
        echantillonAucunClub.push({
          joueur: t.joueur,
          nosClubs: `${nomSortant ?? '?'} → ${nomEntrant ?? '?'}`,
          candidats: candidats.map((c) => `${c.fromClubName} → ${c.toClubName}`).join(' | '),
        });
      }
      continue;
    }

    // Si plusieurs lignes matchent joueur+club, celles à montant connu priment sur les
    // doublons/entrées incomplètes à montant inconnu — sinon on perdait des matches déjà
    // uniques dès qu'une ligne dupliquée sans montant apparaissait pour le même transfert.
    const avecMontantConnu = correspondants.filter((c) => c.transferFeeEur !== null);
    const retenus = avecMontantConnu.length > 0 ? avecMontantConnu : correspondants;

    if (retenus.length > 1) {
      ambigu++;
      continue;
    }

    const feeEur = retenus[0].transferFeeEur;
    if (feeEur === null) {
      montantInconnuCoteSource++;
      continue;
    }

    const montant = formatMontant(feeEur);
    await mettreAJourMontant(t.id, montant);
    completes++;
    if (completions.length < 200) completions.push({ joueur: t.joueur, montant });
  }

  console.log(
    `[transfermarkt-dataset] montants : ${completes}/${sansMontant.length} complétés ` +
    `(joueur introuvable dans le dataset : ${aucunJoueur}, club non reconnu : ${aucunClub}, ambigu : ${ambigu}, ` +
    `montant inconnu côté Transfermarkt aussi : ${montantInconnuCoteSource})`
  );
  if (echantillonAucunJoueur.length > 0) {
    console.log(`[transfermarkt-dataset] échantillon de joueurs introuvables : ${JSON.stringify(echantillonAucunJoueur)}`);
  }
  if (echantillonAucunClub.length > 0) {
    console.log(`[transfermarkt-dataset] échantillon de clubs non reconnus : ${JSON.stringify(echantillonAucunClub)}`);
  }
  if (completions.length > 0) {
    console.log(`[transfermarkt-dataset] montants complétés : ${JSON.stringify(completions)}`);
  }
}

/** Un seul téléchargement du dataset (hebdomadaire côté source), partagé par les deux passages. */
export async function synchroniserTransfermarkt(): Promise<void> {
  let lignes: LigneTransfermarkt[];
  try {
    lignes = await telechargerLignes();
  } catch (err) {
    console.error('[transfermarkt-dataset] échec du téléchargement :', err);
    return;
  }

  await creerTransfertsOfficiels(lignes);
  await completerMontants(lignes);
}
