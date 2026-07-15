import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TURSO_DATABASE_URL/TURSO_AUTH_TOKEN branchent sur une base Turso distante
// (production, gratuite et persistante). Sans ces variables, on retombe sur un
// fichier SQLite local via le même client — aucun compte Turso requis en dev.
const url = process.env.TURSO_DATABASE_URL || `file:${process.env.DATABASE_PATH || path.join(__dirname, '../../mercato.sqlite3')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({ url, authToken });

const LEAGUES_REF = [
  { id: 'pl', nom: 'Premier League', code_court: 'PL', couleur: '#9b8cf0', api_football_id: 39 },
  { id: 'l1', nom: 'Ligue 1', code_court: 'L1', couleur: '#6fa8e0', api_football_id: 61 },
  { id: 'bl', nom: 'Bundesliga', code_court: 'BL', couleur: '#e0776f', api_football_id: 78 },
  { id: 'sa', nom: 'Serie A', code_court: 'SA', couleur: '#6fc59a', api_football_id: 135 },
  { id: 'll', nom: 'La Liga', code_court: 'LL', couleur: '#e0a86f', api_football_id: 140 },
];

const FENETRES_REF = [
  { id: 'e26', label: 'Été 26', sub: '', nom_complet: 'Été 2026', date_debut: '2026-06-01', date_fin: '2026-09-01' },
  { id: 'h26', label: 'Hiver 26', sub: '', nom_complet: 'Hiver 2026', date_debut: '2026-01-01', date_fin: '2026-02-01' },
  { id: 'e25', label: 'Été 25', sub: '', nom_complet: 'Été 2025', date_debut: '2025-06-01', date_fin: '2025-09-01' },
];

let initialized = false;

/** Crée le schéma et le référentiel (championnats/fenêtres) au premier démarrage — idempotent. */
export async function initDb(): Promise<void> {
  if (initialized) return;
  const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await db.executeMultiple(schema);

  for (const l of LEAGUES_REF) {
    await db.execute({
      sql: `INSERT INTO leagues (id, nom, code_court, couleur, api_football_id) VALUES (@id, @nom, @code_court, @couleur, @api_football_id)
            ON CONFLICT(id) DO UPDATE SET nom=excluded.nom, code_court=excluded.code_court, couleur=excluded.couleur, api_football_id=excluded.api_football_id`,
      args: l,
    });
  }
  for (const f of FENETRES_REF) {
    await db.execute({
      sql: `INSERT INTO fenetres (id, label, sub, nom_complet, date_debut, date_fin, en_cours) VALUES (@id, @label, @sub, @nom_complet, @date_debut, @date_fin, 0)
            ON CONFLICT(id) DO NOTHING`,
      args: f,
    });
  }
  initialized = true;
}
