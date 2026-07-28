import { historiquePourTransfert, ajouterHistorique } from '../repo/historique.repo.js';
import { upsertSource } from '../repo/sources.repo.js';
import { findTransfertByCle, getTransfert, insererTransfert, mettreAJourJoueurApiFootballId, mettreAJourStatut } from '../repo/transferts.repo.js';
import { recalculerScoreTransfert, resoudreTransfert } from '../domain/cascade.js';
import { STATUT_LABEL, STATUT_STEP } from '../domain/statutMapping.js';
import { listerToutesAlertes } from '../repo/alertes.repo.js';
import { getClub } from '../repo/clubs.repo.js';
import { envoyerNotification } from './expoPush.js';
import type { LeagueId, Origine, SourceCategorie, Statut, TransfertRow } from '../types.js';

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

function normaliserTexte(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Nom de famille seul (même principe que la correspondance Transfermarkt, voir
 * transfermarktDataset.ts) : les fournisseurs n'écrivent pas tous le prénom de
 * la même façon ("A. Cozier-Duberry" vs nom complet saisi par l'utilisateur
 * dans une alerte), donc comparer le nom complet raterait trop souvent.
 */
function nomDeFamille(nomComplet: string): string {
  const tokens = nomComplet.trim().split(/\s+/);
  return normaliserTexte(tokens[tokens.length - 1]);
}

/**
 * Notifie les alertes (joueur ou club) concernées par ce transfert via le
 * service push Expo. Best-effort : un échec d'envoi (token expiré, etc.) est
 * loggué mais n'interrompt jamais l'enregistrement de la citation elle-même.
 */
async function notifierAlertesConcernees(t: TransfertRow, titre: string): Promise<void> {
  const alertes = await listerToutesAlertes();
  if (alertes.length === 0) return;

  const cibleJoueur = nomDeFamille(t.joueur);
  const concernees = alertes.filter((a) =>
    a.type === 'club'
      ? a.club_id === t.club_sortant_id || a.club_id === t.club_entrant_id
      : a.joueur_nom !== null && nomDeFamille(a.joueur_nom) === cibleJoueur
  );
  if (concernees.length === 0) return;

  const [clubSortant, clubEntrant] = await Promise.all([
    t.club_sortant_id ? getClub(t.club_sortant_id) : undefined,
    t.club_entrant_id ? getClub(t.club_entrant_id) : undefined,
  ]);
  const corps = `${t.joueur} — ${clubSortant?.nom ?? '?'} → ${clubEntrant?.nom ?? '?'} (${STATUT_LABEL[t.statut]})`;

  for (const a of concernees) {
    try {
      await envoyerNotification({ to: a.push_token, title: titre, body: corps, data: { transfertId: t.id } });
    } catch (err) {
      console.error(`[alertes] échec d'envoi de notification (alerte ${a.id}) :`, err);
    }
  }
}

export interface CitationEntrante {
  joueur: string;
  joueurApiFootballId?: number | null;
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
  const preexistant = !!transfert;

  if (!transfert) {
    // Statut initial toujours neutre, même si la citation propose d'emblée
    // officiel/annulé : ça garantit que la résolution passe par le pipeline
    // normal (resoudreTransfert) plutôt que de créer un transfert déjà "résolu"
    // sans jamais avoir traversé le calcul de score / mise à jour des sources.
    const statutInitial: Statut = c.statutPropose === 'officiel' || c.statutPropose === 'annule' ? 'rumeur' : c.statutPropose;
    transfert = await insererTransfert({
      joueur: c.joueur,
      joueurApiFootballId: c.joueurApiFootballId,
      clubSortantId: c.clubSortantId,
      clubEntrantId: c.clubEntrantId,
      championnatId: c.championnatId,
      fenetreId: c.fenetreId,
      statut: statutInitial,
      scoreFiabilite: null,
      montant: c.montant,
      dateTransfert: null,
      cleCorrespondance: cle,
    });
  }

  if (preexistant && (transfert.statut === 'officiel' || transfert.statut === 'annule')) {
    return transfert.id; // déjà résolu — une nouvelle citation tardive ne rouvre rien
  }

  // Rattrape l'id joueur (donc sa photo) si ce transfert a d'abord été créé via
  // une source qui ne le fournit pas (RSS/SportMonks) puis confirmé par
  // API-Football ensuite.
  if (preexistant && !transfert.joueur_api_football_id && c.joueurApiFootballId) {
    await mettreAJourJoueurApiFootballId(transfert.id, c.joueurApiFootballId);
  }

  const source = await upsertSource(c.sourceNom, c.sourceCategorie);

  // Nouvelle rumeur : seulement si elle n'est pas immédiatement résolue (sinon la
  // notification "officiel/annulé" juste en dessous suffit — éviter un doublon).
  if (!preexistant && c.statutPropose !== 'officiel' && c.statutPropose !== 'annule') {
    await notifierAlertesConcernees(transfert, 'Nouvelle rumeur de transfert');
  }

  if (c.statutPropose === 'officiel' || c.statutPropose === 'annule') {
    await resoudreTransfert({ transfertId: transfert.id, resolution: c.statutPropose, date: c.date, sourceId: source.id, origine: c.origine, lienSource: c.lienSource });
    const resolu = (await getTransfert(transfert.id))!;
    await notifierAlertesConcernees(resolu, c.statutPropose === 'officiel' ? 'Transfert officialisé' : 'Transfert annulé');
    return transfert.id;
  }

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

  // Ne fait avancer le statut affiché que si la nouvelle citation est plus avancée que l'actuel
  // (le transfert vient d'être créé ou est encore en cours — jamais officiel/annulé ici).
  const actuel = (await getTransfert(transfert.id))!;
  const stepActuel = STATUT_STEP[actuel.statut as Exclude<Statut, 'annule'>];
  const stepPropose = STATUT_STEP[c.statutPropose as Exclude<Statut, 'annule'>];
  if (stepPropose > stepActuel) {
    await mettreAJourStatut(transfert.id, c.statutPropose, actuel.score_fiabilite);
    if (preexistant) {
      await notifierAlertesConcernees({ ...actuel, statut: c.statutPropose }, 'Mise à jour de transfert');
    }
  }
  await recalculerScoreTransfert(transfert.id);

  return transfert.id;
}
