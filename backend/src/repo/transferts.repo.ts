import { db } from '../db/client.js';
import type { LeagueId, Statut, TransfertRow } from '../types.js';

const stmtByCle = db.prepare<{ cle: string }, TransfertRow>('SELECT * FROM transferts WHERE cle_correspondance = @cle');
const stmtById = db.prepare<{ id: number }, TransfertRow>('SELECT * FROM transferts WHERE id = @id');

const stmtInsert = db.prepare<{
  joueur: string;
  club_sortant_id: number | null;
  club_entrant_id: number | null;
  championnat_id: LeagueId;
  fenetre_id: string;
  statut: Statut;
  score_fiabilite: number | null;
  montant: string | null;
  date_transfert: string | null;
  cle_correspondance: string;
}>(
  `INSERT INTO transferts (joueur, club_sortant_id, club_entrant_id, championnat_id, fenetre_id, statut, score_fiabilite, montant, date_transfert, cle_correspondance)
   VALUES (@joueur, @club_sortant_id, @club_entrant_id, @championnat_id, @fenetre_id, @statut, @score_fiabilite, @montant, @date_transfert, @cle_correspondance)`,
);

const stmtUpdateStatut = db.prepare<{ id: number; statut: Statut; score_fiabilite: number | null; date_transfert: string | null }>(
  "UPDATE transferts SET statut=@statut, score_fiabilite=@score_fiabilite, date_transfert=COALESCE(@date_transfert, date_transfert), updated_at=datetime('now') WHERE id=@id",
);

const stmtUpdateScore = db.prepare<{ id: number; score_fiabilite: number | null }>(
  "UPDATE transferts SET score_fiabilite=@score_fiabilite, updated_at=datetime('now') WHERE id=@id",
);

const stmtByFenetre = db.prepare<{ fenetre_id: string }, TransfertRow>(
  'SELECT * FROM transferts WHERE fenetre_id = @fenetre_id ORDER BY updated_at DESC',
);
const stmtByFenetreEtChampionnat = db.prepare<{ fenetre_id: string; championnat_id: string }, TransfertRow>(
  'SELECT * FROM transferts WHERE fenetre_id = @fenetre_id AND championnat_id = @championnat_id ORDER BY updated_at DESC',
);
const stmtArrivees = db.prepare<{ club_entrant_id: number; fenetre_id: string }, TransfertRow>(
  'SELECT * FROM transferts WHERE club_entrant_id = @club_entrant_id AND fenetre_id = @fenetre_id ORDER BY updated_at DESC',
);
const stmtDeparts = db.prepare<{ club_sortant_id: number; fenetre_id: string }, TransfertRow>(
  'SELECT * FROM transferts WHERE club_sortant_id = @club_sortant_id AND fenetre_id = @fenetre_id ORDER BY updated_at DESC',
);

export function findTransfertByCle(cle: string): TransfertRow | undefined {
  return stmtByCle.get({ cle });
}

export function getTransfert(id: number): TransfertRow | undefined {
  return stmtById.get({ id });
}

export interface NouveauTransfert {
  joueur: string;
  clubSortantId: number | null;
  clubEntrantId: number | null;
  championnatId: LeagueId;
  fenetreId: string;
  statut: Statut;
  scoreFiabilite: number | null;
  montant: string | null;
  dateTransfert: string | null;
  cleCorrespondance: string;
}

export function insererTransfert(t: NouveauTransfert): TransfertRow {
  stmtInsert.run({
    joueur: t.joueur,
    club_sortant_id: t.clubSortantId,
    club_entrant_id: t.clubEntrantId,
    championnat_id: t.championnatId,
    fenetre_id: t.fenetreId,
    statut: t.statut,
    score_fiabilite: t.scoreFiabilite,
    montant: t.montant,
    date_transfert: t.dateTransfert,
    cle_correspondance: t.cleCorrespondance,
  });
  return findTransfertByCle(t.cleCorrespondance)!;
}

export function mettreAJourStatut(id: number, statut: Statut, scoreFiabilite: number | null, dateTransfert?: string | null): void {
  stmtUpdateStatut.run({ id, statut, score_fiabilite: scoreFiabilite, date_transfert: dateTransfert ?? null });
}

export function mettreAJourScore(id: number, scoreFiabilite: number | null): void {
  stmtUpdateScore.run({ id, score_fiabilite: scoreFiabilite });
}

export function listerParFenetre(fenetreId: string, championnatId?: LeagueId): TransfertRow[] {
  return championnatId
    ? stmtByFenetreEtChampionnat.all({ fenetre_id: fenetreId, championnat_id: championnatId })
    : stmtByFenetre.all({ fenetre_id: fenetreId });
}

export function arriveesPourClub(clubEntrantId: number, fenetreId: string): TransfertRow[] {
  return stmtArrivees.all({ club_entrant_id: clubEntrantId, fenetre_id: fenetreId });
}

export function departsPourClub(clubSortantId: number, fenetreId: string): TransfertRow[] {
  return stmtDeparts.all({ club_sortant_id: clubSortantId, fenetre_id: fenetreId });
}

export const STATUTS_NON_TERMINAUX: Statut[] = ['rumeur', 'contact_confirme', 'negociation', 'accord_clubs', 'accord_joueur'];
