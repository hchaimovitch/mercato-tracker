import { fenetrePourDate } from '../repo/fenetres.repo.js';
import { listLeagues } from '../repo/leagues.repo.js';
import { getClubByApiFootballId, listerClubsBig5, resoudreOuCreerClubExterne, upsertClubFromApiFootball } from '../repo/clubs.repo.js';
import { getEtat, getEtatJson, setEtat, setEtatJson } from '../repo/syncState.repo.js';
import { enregistrerCitation } from './matching.js';
import { appelsRestants, enregistrerAppel, peutAppeler } from './quota.js';
import { getTeams, getTransfersForTeam, SAISON_DECOUVERTE_EQUIPES } from './apiFootball.client.js';
import type { LeagueId } from '../types.js';

const PROVIDER = 'api_football';
const PLAFOND_JOURNALIER = Number(process.env.API_FOOTBALL_DAILY_CAP || 90); // marge sous le quota gratuit de 100/jour
const TAILLE_LOT_PAR_RUN = Number(process.env.API_FOOTBALL_BATCH_SIZE || 20);
const EQUIPES_TTL_JOURS = 7;
// Le plan gratuit limite aussi à 10 req/min (pas seulement 100/jour) — sans pause entre
// les appels d'un même lot, ce plafond était dépassé, ce qui a mené à une suspension du
// compte. Marge sous 6s (10/min) pour rester large.
const DELAI_ENTRE_APPELS_MS = Number(process.env.API_FOOTBALL_MIN_INTERVAL_MS || 6500);

function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function joursDepuis(dateIso: string): number {
  return (Date.now() - new Date(dateIso).getTime()) / 86_400_000;
}

/** Rafraîchit la liste des clubs par championnat — rare (1x/semaine), donc peu coûteux en quota. */
export async function synchroniserEquipes(): Promise<void> {
  for (const league of await listLeagues()) {
    if (!league.api_football_id) continue;
    const cle = `equipes_maj:${league.id}`;
    const derniereMaj = await getEtat(cle);
    if (derniereMaj && joursDepuis(derniereMaj) < EQUIPES_TTL_JOURS) continue;
    if (!(await peutAppeler(PROVIDER, PLAFOND_JOURNALIER))) {
      console.log(`[api-football] quota atteint, report du rafraîchissement des clubs pour ${league.id}`);
      return;
    }
    try {
      // Saison figée (2022-2024, seule plage autorisée par le plan gratuit) —
      // sert uniquement à découvrir les identifiants de clubs, qui restent
      // valables tels quels pour /transfers (non restreint par saison).
      const saison = SAISON_DECOUVERTE_EQUIPES;
      const equipes = await getTeams(league.api_football_id, saison);
      await enregistrerAppel(PROVIDER);
      for (const e of equipes) await upsertClubFromApiFootball(e.team.name, league.id as LeagueId, e.team.id, e.team.logo ?? null);
      await setEtat(cle, new Date().toISOString());
      console.log(`[api-football] ${equipes.length} clubs synchronisés pour ${league.id} (saison ${saison})`);
      await attendre(DELAI_ENTRE_APPELS_MS);
    } catch (err) {
      // Une ligue en échec (ex: clé invalide) ne doit pas bloquer les autres —
      // pas de setEtat ici, donc cette ligue sera retentée au prochain passage.
      console.error(`[api-football] échec sync clubs pour ${league.id} :`, err);
    }
  }
}

interface FileAttente {
  clubIds: number[];
}

/** Synchronise les transferts confirmés, par lot, en tournante sur l'ensemble des clubs Big 5 pour respecter le quota. */
export async function synchroniserTransfertsOfficiels(): Promise<void> {
  await synchroniserEquipes();

  const clubsParId = new Map((await listerClubsBig5()).map((c) => [c.id, c]));

  let file = await getEtatJson<FileAttente>('file_clubs_transferts', { clubIds: [] });
  if (file.clubIds.length === 0) {
    file = { clubIds: [...clubsParId.keys()] };
    console.log(`[api-football] nouvelle tournée de synchronisation : ${file.clubIds.length} clubs`);
  }

  const restants = await appelsRestants(PROVIDER, PLAFOND_JOURNALIER);
  const taille = Math.max(0, Math.min(TAILLE_LOT_PAR_RUN, restants));
  const lot = file.clubIds.slice(0, taille);
  const reste = file.clubIds.slice(taille);
  await setEtatJson('file_clubs_transferts', { clubIds: reste });

  if (lot.length === 0) {
    console.log('[api-football] rien à synchroniser ce passage (quota épuisé ou lot vide)');
    return;
  }

  for (const clubId of lot) {
    const club = clubsParId.get(clubId);
    if (!club?.api_football_id) continue;

    // Logs de diagnostic temporaires (blocage observé en prod dont le point exact
    // n'est pas encore identifié : DB quota check ? appel /transfers malgré le
    // timeout ajouté ? le sleep lui-même ?) — à retirer une fois la cause confirmée.
    console.log(`[api-football] club ${club.nom} : vérification quota…`);
    if (!(await peutAppeler(PROVIDER, PLAFOND_JOURNALIER))) break;

    console.log(`[api-football] club ${club.nom} : appel /transfers…`);
    let transferts;
    try {
      transferts = await getTransfersForTeam(club.api_football_id);
      await enregistrerAppel(PROVIDER);
    } catch (err) {
      console.error(`[api-football] échec sync transferts club ${club.nom} :`, err);
      console.log(`[api-football] club ${club.nom} : pause après échec…`);
      await attendre(DELAI_ENTRE_APPELS_MS);
      console.log(`[api-football] club ${club.nom} : pause terminée`);
      continue;
    }
    console.log(`[api-football] club ${club.nom} : ${transferts.length} entrée(s) reçue(s), pause…`);
    await attendre(DELAI_ENTRE_APPELS_MS);

    for (const joueurTransferts of transferts) {
      for (const t of joueurTransferts.transfers) {
        try {
          if (!t.teams.in || !t.teams.out) continue;
          const fenetre = await fenetrePourDate(t.date);
          if (!fenetre) continue; // hors des fenêtres suivies

          const estEntrant = t.teams.in.id === club.api_football_id;
          const estSortant = t.teams.out.id === club.api_football_id;
          if (!estEntrant && !estSortant) continue;

          const autreCote = estEntrant ? t.teams.out : t.teams.in;
          // Certains mouvements (agent libre, retraite, club hors couverture) ont
          // un id/name à null côté API — on ne peut alors pas identifier l'autre
          // club de façon fiable, donc on ignore plutôt que d'inventer une donnée.
          if (autreCote.id == null || !autreCote.name) continue;
          const autreClub = (await getClubByApiFootballId(autreCote.id)) ?? (await resoudreOuCreerClubExterne(autreCote.id, autreCote.name));

          const clubEntrantId = estEntrant ? club.id : autreClub.id;
          const clubSortantId = estEntrant ? autreClub.id : club.id;

          await enregistrerCitation({
            joueur: joueurTransferts.player.name,
            clubSortantId,
            clubEntrantId,
            championnatId: club.championnat_id as LeagueId,
            fenetreId: fenetre.id,
            statutPropose: 'officiel',
            montant: t.type,
            date: t.date,
            sourceNom: 'API-Football (confirmation officielle)',
            sourceCategorie: 'club_officiel',
            origine: 'automatique_api',
          });
        } catch (err) {
          // Un enregistrement individuel malformé ne doit pas interrompre la
          // synchronisation des autres transferts/clubs du lot.
          console.error(`[api-football] échec traitement d'un transfert (club ${club.nom}, joueur ${joueurTransferts.player.name}) :`, err);
        }
      }
    }
  }

  console.log(`[api-football] lot de ${lot.length} clubs synchronisé, ${reste.length} restants dans la file`);
}
