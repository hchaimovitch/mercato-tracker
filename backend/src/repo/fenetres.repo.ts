import { db } from '../db/client.js';
import type { FenetreRow } from '../types.js';

function toFenetreRow(r: any): FenetreRow {
  return {
    id: r.id, label: r.label, sub: r.sub, nom_complet: r.nom_complet,
    date_debut: r.date_debut, date_fin: r.date_fin, en_cours: Number(r.en_cours),
  };
}

export async function listFenetres(): Promise<FenetreRow[]> {
  const rs = await db.execute('SELECT * FROM fenetres ORDER BY date_debut DESC');
  return rs.rows.map(toFenetreRow);
}

export async function getFenetre(id: string): Promise<FenetreRow | undefined> {
  const rs = await db.execute({ sql: 'SELECT * FROM fenetres WHERE id = @id', args: { id } });
  return rs.rows[0] ? toFenetreRow(rs.rows[0]) : undefined;
}

/** Trouve la fenêtre dont l'intervalle de dates contient la date donnée (ISO yyyy-mm-dd). */
export async function fenetrePourDate(dateIso: string): Promise<FenetreRow | undefined> {
  const rs = await db.execute('SELECT * FROM fenetres ORDER BY date_debut ASC');
  const rows = rs.rows.map(toFenetreRow);
  return rows.find((f) => f.date_debut <= dateIso && dateIso <= f.date_fin);
}
