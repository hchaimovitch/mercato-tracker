import { db } from '../db/client.js';
import type { LeagueId, Statut, TransfertRow } from '../types.js';

function toTransfertRow(r: any): TransfertRow {
  return {
    id: Number(r.id), joueur: r.joueur,
    joueur_api_football_id: r.joueur_api_football_id === null ? null : Number(r.joueur_api_football_id),
    club_sortant_id: r.club_sortant_id === null ? null : Number(r.club_sortant_id),
    club_entrant_id: r.club_entrant_id === null ? null : Number(r.club_entrant_id),
    championnat_id: r.championnat_id, fenetre_id: r.fenetre_id, statut: r.statut,
    score_fiabilite: r.score_fiabilite === null ? null : Number(r.score_fiabilite),
    montant: r.montant, date_transfert: r.date_transfert, cle_correspondance: r.cle_correspondance,
    created_at: r.created_at, updated_at: r.updated_at,
  };
}

export async function findTransfertByCle(cle: string): Promise<TransfertRow | undefined> {
  const rs = await db.execute({ sql: 'SELECT * FROM transferts WHERE cle_correspondance = @cle', args: { cle } });
  return rs.rows[0] ? toTransfertRow(rs.rows[0]) : undefined;
}

export async function getTransfert(id: number): Promise<TransfertRow | undefined> {
  const rs = await db.execute({ sql: 'SELECT * FROM transferts WHERE id = @id', args: { id } });
  return rs.rows[0] ? toTransfertRow(rs.rows[0]) : undefined;
}

export interface NouveauTransfert {
  joueur: string;
  joueurApiFootballId?: number | null;
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

export async function insererTransfert(t: NouveauTransfert): Promise<TransfertRow> {
  await db.execute({
    sql: `INSERT INTO transferts (joueur, joueur_api_football_id, club_sortant_id, club_entrant_id, championnat_id, fenetre_id, statut, score_fiabilite, montant, date_transfert, cle_correspondance)
          VALUES (@joueur, @joueur_api_football_id, @club_sortant_id, @club_entrant_id, @championnat_id, @fenetre_id, @statut, @score_fiabilite, @montant, @date_transfert, @cle_correspondance)`,
    args: {
      joueur: t.joueur, joueur_api_football_id: t.joueurApiFootballId ?? null,
      club_sortant_id: t.clubSortantId, club_entrant_id: t.clubEntrantId,
      championnat_id: t.championnatId, fenetre_id: t.fenetreId, statut: t.statut,
      score_fiabilite: t.scoreFiabilite, montant: t.montant, date_transfert: t.dateTransfert,
      cle_correspondance: t.cleCorrespondance,
    },
  });
  return (await findTransfertByCle(t.cleCorrespondance))!;
}

export async function mettreAJourStatut(id: number, statut: Statut, scoreFiabilite: number | null, dateTransfert?: string | null): Promise<void> {
  await db.execute({
    sql: "UPDATE transferts SET statut=@statut, score_fiabilite=@score_fiabilite, date_transfert=COALESCE(@date_transfert, date_transfert), updated_at=datetime('now') WHERE id=@id",
    args: { id, statut, score_fiabilite: scoreFiabilite, date_transfert: dateTransfert ?? null },
  });
}

export async function mettreAJourScore(id: number, scoreFiabilite: number | null): Promise<void> {
  await db.execute({
    sql: "UPDATE transferts SET score_fiabilite=@score_fiabilite, updated_at=datetime('now') WHERE id=@id",
    args: { id, score_fiabilite: scoreFiabilite },
  });
}

/**
 * "Sans montant chiffré" — pas juste `montant IS NULL` : la sync API-Football
 * remplit ce champ avec le *type* de mouvement ("Transfer", "Loan", "N/A"…),
 * jamais NULL en pratique (voir apiFootball.sync.ts). Un placeholder de ce
 * genre ne contient aucun chiffre, contrairement à un vrai montant ("€30M")
 * ou à "Libre" — mais "Libre" n'en contient pas non plus, donc un transfert
 * déjà confirmé libre sera réexaminé au prochain passage : sans conséquence,
 * juste un peu de travail refait.
 */
export async function listerTransfertsSansMontant(): Promise<TransfertRow[]> {
  const rs = await db.execute("SELECT * FROM transferts WHERE montant IS NULL OR montant NOT GLOB '*[0-9]*'");
  return rs.rows.map(toTransfertRow);
}

export async function mettreAJourJoueurApiFootballId(id: number, joueurApiFootballId: number): Promise<void> {
  await db.execute({
    sql: 'UPDATE transferts SET joueur_api_football_id = @joueur_api_football_id WHERE id = @id',
    args: { id, joueur_api_football_id: joueurApiFootballId },
  });
}

export async function mettreAJourMontant(id: number, montant: string): Promise<void> {
  await db.execute({
    sql: "UPDATE transferts SET montant=@montant, updated_at=datetime('now') WHERE id=@id",
    args: { id, montant },
  });
}

export async function listerParFenetre(fenetreId: string, championnatId?: LeagueId): Promise<TransfertRow[]> {
  const rs = championnatId
    ? await db.execute({ sql: 'SELECT * FROM transferts WHERE fenetre_id = @fenetre_id AND championnat_id = @championnat_id ORDER BY updated_at DESC', args: { fenetre_id: fenetreId, championnat_id: championnatId } })
    : await db.execute({ sql: 'SELECT * FROM transferts WHERE fenetre_id = @fenetre_id ORDER BY updated_at DESC', args: { fenetre_id: fenetreId } });
  return rs.rows.map(toTransfertRow);
}

export async function arriveesPourClub(clubEntrantId: number, fenetreId: string): Promise<TransfertRow[]> {
  const rs = await db.execute({ sql: 'SELECT * FROM transferts WHERE club_entrant_id = @club_entrant_id AND fenetre_id = @fenetre_id ORDER BY updated_at DESC', args: { club_entrant_id: clubEntrantId, fenetre_id: fenetreId } });
  return rs.rows.map(toTransfertRow);
}

export async function departsPourClub(clubSortantId: number, fenetreId: string): Promise<TransfertRow[]> {
  const rs = await db.execute({ sql: 'SELECT * FROM transferts WHERE club_sortant_id = @club_sortant_id AND fenetre_id = @fenetre_id ORDER BY updated_at DESC', args: { club_sortant_id: clubSortantId, fenetre_id: fenetreId } });
  return rs.rows.map(toTransfertRow);
}

export const STATUTS_NON_TERMINAUX: Statut[] = ['rumeur', 'contact_confirme', 'negociation', 'accord_clubs', 'accord_joueur'];
