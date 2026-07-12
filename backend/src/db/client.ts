import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../mercato.sqlite3');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Référentiel des 5 grands championnats — config statique, pas des données de
// transfert. api_football_id vient de la doc publique API-Football ; vérifié/
// recoupé au premier sync (voir ingestion/apiFootball.ts) plutôt que supposé fiable.
const LEAGUES_REF = [
  { id: 'pl', nom: 'Premier League', code_court: 'PL', couleur: '#9b8cf0', api_football_id: 39 },
  { id: 'l1', nom: 'Ligue 1', code_court: 'L1', couleur: '#6fa8e0', api_football_id: 61 },
  { id: 'bl', nom: 'Bundesliga', code_court: 'BL', couleur: '#e0776f', api_football_id: 78 },
  { id: 'sa', nom: 'Serie A', code_court: 'SA', couleur: '#6fc59a', api_football_id: 135 },
  { id: 'll', nom: 'La Liga', code_court: 'LL', couleur: '#e0a86f', api_football_id: 140 },
];

const insertLeague = db.prepare(`
  INSERT INTO leagues (id, nom, code_court, couleur, api_football_id)
  VALUES (@id, @nom, @code_court, @couleur, @api_football_id)
  ON CONFLICT(id) DO UPDATE SET nom=excluded.nom, code_court=excluded.code_court, couleur=excluded.couleur, api_football_id=excluded.api_football_id
`);
for (const l of LEAGUES_REF) insertLeague.run(l);

// Fenêtres de mercato — dates calendaires réelles (approximatives, varient de
// quelques jours selon les championnats). "en_cours" est calculé à la lecture
// (voir domain/fenetres.ts), pas stocké en dur ici.
const FENETRES_REF = [
  { id: 'e26', label: 'Été 26', sub: '', nom_complet: 'Été 2026', date_debut: '2026-06-01', date_fin: '2026-09-01' },
  { id: 'h26', label: 'Hiver 26', sub: '', nom_complet: 'Hiver 2026', date_debut: '2026-01-01', date_fin: '2026-02-01' },
  { id: 'e25', label: 'Été 25', sub: '', nom_complet: 'Été 2025', date_debut: '2025-06-01', date_fin: '2025-09-01' },
];
const insertFenetre = db.prepare(`
  INSERT INTO fenetres (id, label, sub, nom_complet, date_debut, date_fin, en_cours)
  VALUES (@id, @label, @sub, @nom_complet, @date_debut, @date_fin, 0)
  ON CONFLICT(id) DO NOTHING
`);
for (const f of FENETRES_REF) insertFenetre.run(f);
