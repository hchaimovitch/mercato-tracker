import { fenetrePourDate } from '../repo/fenetres.repo.js';
import { trouverClubBig5ParNom } from '../repo/clubs.repo.js';
import { getEtat, setEtat } from '../repo/syncState.repo.js';
import { statutDepuisProbabilite } from '../domain/statutMapping.js';
import { enregistrerCitation } from './matching.js';
import { categoriserSource } from './sourceCategorization.js';
import { getRumeursEntreDates, isSportmonksActif } from './sportmonks.client.js';
import { enregistrerAppel, peutAppeler } from './quota.js';
import type { LeagueId } from '../types.js';

const PROVIDER = 'sportmonks';
// Plafond conservateur par défaut — le quota réel dépend du plan souscrit
// (non public pour l'add-on Transfer Rumours, voir audit). À ajuster une fois
// l'abonnement confirmé, via SPORTMONKS_DAILY_CAP.
const PLAFOND_JOURNALIER = Number(process.env.SPORTMONKS_DAILY_CAP || 48);

export async function synchroniserRumeurs(): Promise<void> {
  if (!isSportmonksActif()) {
    console.log('[sportmonks] désactivé (SPORTMONKS_KEY absente) — mode transferts officiels uniquement');
    return;
  }
  if (!(await peutAppeler(PROVIDER, PLAFOND_JOURNALIER))) {
    console.log('[sportmonks] quota atteint pour aujourd\'hui, report');
    return;
  }

  const fin = new Date().toISOString().slice(0, 10);
  const debut = (await getEtat('sportmonks_derniere_sync')) ?? new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);

  let rumeurs;
  try {
    rumeurs = await getRumeursEntreDates(debut, fin);
    await enregistrerAppel(PROVIDER);
  } catch (err) {
    console.error('[sportmonks] échec de synchronisation des rumeurs :', err);
    return;
  }

  let retenues = 0;
  for (const r of rumeurs) {
    if (!r.player) continue;

    const clubEntrant = r.toTeam ? await trouverClubBig5ParNom(r.toTeam.name) : undefined;
    const clubSortant = r.fromTeam ? await trouverClubBig5ParNom(r.fromTeam.name) : undefined;
    if (!clubEntrant && !clubSortant) continue; // ni club connu ni correspondance de nom — on ignore plutôt que de deviner

    const fenetre = await fenetrePourDate(r.date);
    if (!fenetre) continue;

    const championnatId = (clubEntrant ?? clubSortant)!.championnat_id as LeagueId;
    const sourceNom = r.source_name || 'Source non nommée';

    await enregistrerCitation({
      joueur: r.player.name,
      clubSortantId: clubSortant?.id ?? null,
      clubEntrantId: clubEntrant?.id ?? null,
      championnatId,
      fenetreId: fenetre.id,
      statutPropose: statutDepuisProbabilite(r.probability),
      montant: r.fee ? `€${r.fee}M` : null,
      date: r.date,
      sourceNom,
      sourceCategorie: categoriserSource(sourceNom),
      origine: 'automatique_api',
      lienSource: r.source_url,
    });
    retenues++;
  }

  await setEtat('sportmonks_derniere_sync', fin);
  console.log(`[sportmonks] ${retenues}/${rumeurs.length} rumeurs retenues (autres : club non reconnu ou hors fenêtre suivie)`);
}
