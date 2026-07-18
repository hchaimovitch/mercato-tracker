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

  return lignes.map((l) => ({
    playerName: l.player_name,
    transferDate: l.transfer_date,
    fromClubName: l.from_club_name,
    toClubName: l.to_club_name,
    transferFeeEur: l.transfer_fee === '' || l.transfer_fee === undefined ? null : Number(l.transfer_fee),
  })).filter((l) => l.playerName && l.transferFeeEur !== null);
}

/**
 * Complète le montant des transferts déjà enregistrés (via API-Football) qui n'en ont pas.
 * Correspondance par nom de joueur normalisé, désambiguïsée par le nom du club (dans un sens
 * ou l'autre) car Transfermarkt utilise son propre espace d'identifiants, sans lien avec ceux
 * d'API-Football. Comme pour la correspondance SportMonks : en cas de doute (plusieurs
 * candidats, aucun club qui corresponde), on ignore plutôt que de risquer un mauvais montant.
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
    const cle = normaliserTexte(l.playerName);
    const groupe = parJoueur.get(cle);
    if (groupe) groupe.push(l);
    else parJoueur.set(cle, [l]);
  }

  let completes = 0;
  for (const t of sansMontant) {
    const candidats = parJoueur.get(normaliserTexte(t.joueur));
    if (!candidats || candidats.length === 0) continue;

    const nomSortant = t.club_sortant_id ? (await getClub(t.club_sortant_id))?.nom : undefined;
    const nomEntrant = t.club_entrant_id ? (await getClub(t.club_entrant_id))?.nom : undefined;
    const cibleSortant = nomSortant ? normaliserTexte(nomSortant) : undefined;
    const cibleEntrant = nomEntrant ? normaliserTexte(nomEntrant) : undefined;

    const correspondants = candidats.filter((c) => {
      const from = normaliserTexte(c.fromClubName);
      const to = normaliserTexte(c.toClubName);
      return (cibleSortant && from === cibleSortant) || (cibleEntrant && to === cibleEntrant);
    });
    if (correspondants.length !== 1) continue; // ambigu ou aucune correspondance de club — on ignore

    await mettreAJourMontant(t.id, formatMontant(correspondants[0].transferFeeEur!));
    completes++;
  }

  console.log(`[transfermarkt-dataset] ${completes}/${sansMontant.length} montants complétés`);
}
