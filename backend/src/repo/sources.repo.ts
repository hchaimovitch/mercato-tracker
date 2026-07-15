import { db } from '../db/client.js';
import type { SourceCategorie, SourceRow } from '../types.js';

function toSourceRow(r: any): SourceRow {
  return {
    id: Number(r.id), nom: r.nom, categorie: r.categorie,
    rumeurs_confirmees: Number(r.rumeurs_confirmees), rumeurs_infirmees: Number(r.rumeurs_infirmees),
    created_at: r.created_at, updated_at: r.updated_at,
  };
}

export async function getSourceById(id: number): Promise<SourceRow | undefined> {
  const rs = await db.execute({ sql: 'SELECT * FROM sources WHERE id = @id', args: { id } });
  return rs.rows[0] ? toSourceRow(rs.rows[0]) : undefined;
}

export async function getSourceByNom(nom: string): Promise<SourceRow | undefined> {
  const rs = await db.execute({ sql: 'SELECT * FROM sources WHERE nom = @nom', args: { nom } });
  return rs.rows[0] ? toSourceRow(rs.rows[0]) : undefined;
}

/** Crée la source si elle n'existe pas encore (compteurs à 0 — pas d'historique pré-rempli). */
export async function upsertSource(nom: string, categorie: SourceCategorie): Promise<SourceRow> {
  const existing = await getSourceByNom(nom);
  if (existing) return existing;
  await db.execute({ sql: 'INSERT INTO sources (nom, categorie) VALUES (@nom, @categorie)', args: { nom, categorie } });
  return (await getSourceByNom(nom))!;
}

export async function incrementerConfirmee(id: number): Promise<void> {
  await db.execute({
    sql: "UPDATE sources SET rumeurs_confirmees = rumeurs_confirmees + 1, updated_at = datetime('now') WHERE id = @id",
    args: { id },
  });
}

export async function incrementerInfirmee(id: number): Promise<void> {
  await db.execute({
    sql: "UPDATE sources SET rumeurs_infirmees = rumeurs_infirmees + 1, updated_at = datetime('now') WHERE id = @id",
    args: { id },
  });
}

export async function listSources(): Promise<SourceRow[]> {
  const rs = await db.execute('SELECT * FROM sources ORDER BY nom');
  return rs.rows.map(toSourceRow);
}
