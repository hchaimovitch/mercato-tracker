import { db } from '../db/client.js';
import type { FenetreRow } from '../types.js';

const stmtAll = db.prepare<[], FenetreRow>('SELECT * FROM fenetres ORDER BY date_debut DESC');
const stmtById = db.prepare<{ id: string }, FenetreRow>('SELECT * FROM fenetres WHERE id = @id');
const stmtAllOrderedAsc = db.prepare<[], FenetreRow>('SELECT * FROM fenetres ORDER BY date_debut ASC');

export function listFenetres(): FenetreRow[] {
  return stmtAll.all();
}

export function getFenetre(id: string): FenetreRow | undefined {
  return stmtById.get({ id });
}

/** Trouve la fenêtre dont l'intervalle de dates contient la date donnée (ISO yyyy-mm-dd). */
export function fenetrePourDate(dateIso: string): FenetreRow | undefined {
  return stmtAllOrderedAsc.all().find((f) => f.date_debut <= dateIso && dateIso <= f.date_fin);
}
