import { gunzipSync } from 'node:zlib';
import { parse } from 'csv-parse/sync';
import { getClub } from '../repo/clubs.repo.js';
import { listerTransfertsSansMontant, mettreAJourMontant } from '../repo/transferts.repo.js';

/**
 * Jeu de données CC0-1.0 publié par https://github.com/dcaribou/transfermarkt-datasets
 * (scraping + republication déjà faits par ce tiers, rafraîchis chaque semaine par leur
 * propre pipeline). On ne fait ici que télécharger un fichier déjà publié — aucune requête
 * n'est jamais envoyée à transfermarkt.com depuis ce backend. Utilisé uniquement pour
 * compléter le montant des transferts déjà connus via API-Football (qui ne fournit pas ce
 * champ sur l'offre gratuite), jamais pour créer de nouveaux transferts.
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
 * Complète le montant des transferts déjà enregistrés (via API-Football) qui n'en ont pas.
 * Correspondance par nom de famille du joueur (voir cleJoueur), désambiguïsée par le nom du
 * club (dans un sens ou l'autre) car Transfermarkt utilise son propre espace d'identifiants,
 * sans lien avec ceux d'API-Football. Comme pour la correspondance SportMonks : en cas de
 * doute (plusieurs candidats, aucun club qui corresponde), on ignore plutôt que de risquer un
 * mauvais montant.
 */
export async function synchroniserMontantsTransfermarkt(): Promise<void> {
  const sansMontant = await listerTransfertsSansMontant();
  if (sansMontant.length === 0) {
    console.log('[transfermarkt-dataset] rien à compléter');
    return;
  }

  let lignes: LigneTransfermarkt[];
  try {
    lignes = await telechargerLignes();
  } catch (err) {
    console.error('[transfermarkt-dataset] échec du téléchargement :', err);
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
    if (correspondants.length > 1) {
      ambigu++;
      continue;
    }

    const feeEur = correspondants[0].transferFeeEur;
    if (feeEur === null) {
      montantInconnuCoteSource++;
      continue;
    }

    await mettreAJourMontant(t.id, formatMontant(feeEur));
    completes++;
  }

  console.log(
    `[transfermarkt-dataset] ${completes}/${sansMontant.length} montants complétés ` +
    `(joueur introuvable dans le dataset : ${aucunJoueur}, club non reconnu : ${aucunClub}, ambigu : ${ambigu}, ` +
    `montant inconnu côté Transfermarkt aussi : ${montantInconnuCoteSource})`
  );
  if (echantillonAucunJoueur.length > 0) {
    console.log(`[transfermarkt-dataset] échantillon de joueurs introuvables : ${JSON.stringify(echantillonAucunJoueur)}`);
  }
  if (echantillonAucunClub.length > 0) {
    console.log(`[transfermarkt-dataset] échantillon de clubs non reconnus : ${JSON.stringify(echantillonAucunClub)}`);
  }
}
