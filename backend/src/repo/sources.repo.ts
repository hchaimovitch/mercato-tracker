import { db } from '../db/client.js';
import type { SourceCategorie, SourceRow } from '../types.js';

const stmtGetById = db.prepare<{ id: number }, SourceRow>('SELECT * FROM sources WHERE id = @id');
const stmtGetByNom = db.prepare<{ nom: string }, SourceRow>('SELECT * FROM sources WHERE nom = @nom');
const stmtInsert = db.prepare<{ nom: string; categorie: SourceCategorie }>(
  'INSERT INTO sources (nom, categorie) VALUES (@nom, @categorie)',
);
const stmtIncrConfirmee = db.prepare<{ id: number }>(
  "UPDATE sources SET rumeurs_confirmees = rumeurs_confirmees + 1, updated_at = datetime('now') WHERE id = @id",
);
const stmtIncrInfirmee = db.prepare<{ id: number }>(
  "UPDATE sources SET rumeurs_infirmees = rumeurs_infirmees + 1, updated_at = datetime('now') WHERE id = @id",
);
const stmtAll = db.prepare<[], SourceRow>('SELECT * FROM sources ORDER BY nom');

export function getSourceById(id: number): SourceRow | undefined {
  return stmtGetById.get({ id });
}

export function getSourceByNom(nom: string): SourceRow | undefined {
  return stmtGetByNom.get({ nom });
}

/** Crée la source si elle n'existe pas encore (compteurs à 0 — pas d'historique pré-rempli). */
export function upsertSource(nom: string, categorie: SourceCategorie): SourceRow {
  const existing = getSourceByNom(nom);
  if (existing) return existing;
  stmtInsert.run({ nom, categorie });
  return getSourceByNom(nom)!;
}

export function incrementerConfirmee(id: number): void {
  stmtIncrConfirmee.run({ id });
}

export function incrementerInfirmee(id: number): void {
  stmtIncrInfirmee.run({ id });
}

export function listSources(): SourceRow[] {
  return stmtAll.all();
}
