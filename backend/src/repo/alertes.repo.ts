import { db } from '../db/client.js';
import type { AlerteRow, AlerteType } from '../types.js';

function toAlerteRow(r: any): AlerteRow {
  return {
    id: Number(r.id), push_token: r.push_token, type: r.type,
    joueur_nom: r.joueur_nom ?? null,
    club_id: r.club_id === null ? null : Number(r.club_id),
    created_at: r.created_at,
  };
}

export interface NouvelleAlerte {
  pushToken: string;
  type: AlerteType;
  joueurNom: string | null;
  clubId: number | null;
}

export async function creerAlerte(a: NouvelleAlerte): Promise<AlerteRow> {
  const inserted = await db.execute({
    sql: 'INSERT INTO alertes (push_token, type, joueur_nom, club_id) VALUES (@push_token, @type, @joueur_nom, @club_id)',
    args: { push_token: a.pushToken, type: a.type, joueur_nom: a.joueurNom, club_id: a.clubId },
  });
  const rs = await db.execute({ sql: 'SELECT * FROM alertes WHERE id = @id', args: { id: Number(inserted.lastInsertRowid) } });
  return toAlerteRow(rs.rows[0]);
}

export async function listerAlertesParToken(pushToken: string): Promise<AlerteRow[]> {
  const rs = await db.execute({ sql: 'SELECT * FROM alertes WHERE push_token = @push_token ORDER BY created_at DESC', args: { push_token: pushToken } });
  return rs.rows.map(toAlerteRow);
}

export async function supprimerAlerte(id: number, pushToken: string): Promise<void> {
  // Scope au push_token du demandeur : sans compte utilisateur, c'est la seule
  // barrière empêchant un appareil de supprimer l'alerte d'un autre en devinant un id.
  await db.execute({ sql: 'DELETE FROM alertes WHERE id = @id AND push_token = @push_token', args: { id, push_token: pushToken } });
}

/** Table à échelle strictement personnelle — tout charger et filtrer en mémoire est largement suffisant. */
export async function listerToutesAlertes(): Promise<AlerteRow[]> {
  const rs = await db.execute('SELECT * FROM alertes');
  return rs.rows.map(toAlerteRow);
}
