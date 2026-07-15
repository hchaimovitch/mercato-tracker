// Schéma inline (pas un fichier .sql séparé) : `tsc` ne copie que les .ts vers
// dist/, un .sql à côté serait absent du build de production — vu à l'usage
// sur un premier déploiement Render (ENOENT sur schema.sql en prod).

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS leagues (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  code_court TEXT NOT NULL,
  couleur TEXT NOT NULL,
  api_football_id INTEGER,
  sportmonks_id INTEGER
);

-- championnat_id référence normalement leagues(id), sauf valeur spéciale 'ext'
-- pour un club hors Big 5 (l'autre bout d'un transfert transfrontalier) — pas
-- de contrainte FK stricte ici pour permettre ce cas sans table fictive.
CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  championnat_id TEXT NOT NULL,
  couleur TEXT NOT NULL,
  abbr TEXT NOT NULL,
  api_football_id INTEGER UNIQUE,
  sportmonks_id INTEGER UNIQUE
);

CREATE TABLE IF NOT EXISTS fenetres (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sub TEXT NOT NULL,
  nom_complet TEXT NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  en_cours INTEGER NOT NULL DEFAULT 0
);

-- Fiabilité de source : rumeurs_confirmees/infirmees démarrent à 0 pour tout le
-- monde (voir domain/wilson.ts) — aucun historique "pré-rempli" n'est injecté.
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL UNIQUE,
  categorie TEXT NOT NULL CHECK(categorie IN ('club_officiel','journaliste_reconnu','media_generaliste','non_verifie')),
  rumeurs_confirmees INTEGER NOT NULL DEFAULT 0,
  rumeurs_infirmees INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- cle_correspondance : clé de dédoublonnage heuristique (joueur+clubs+fenêtre)
-- utilisée pour faire correspondre une même transaction réelle vue par deux
-- fournisseurs différents (ex: rumeur SportMonks puis confirmation API-Football).
-- C'est une approximation documentée, pas un identifiant universel garanti.
CREATE TABLE IF NOT EXISTS transferts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  joueur TEXT NOT NULL,
  club_sortant_id INTEGER REFERENCES clubs(id),
  club_entrant_id INTEGER REFERENCES clubs(id),
  championnat_id TEXT NOT NULL REFERENCES leagues(id),
  fenetre_id TEXT NOT NULL REFERENCES fenetres(id),
  statut TEXT NOT NULL CHECK(statut IN ('rumeur','contact_confirme','negociation','accord_clubs','accord_joueur','officiel','annule')),
  score_fiabilite REAL,
  montant TEXT,
  date_transfert TEXT,
  cle_correspondance TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- origine distingue une entrée déduite automatiquement (probabilité d'API mappée
-- sur un statut) d'une entrée confirmée par une source officielle ou saisie en
-- curation manuelle — cette distinction est affichée dans l'app.
CREATE TABLE IF NOT EXISTS historique_statut (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfert_id INTEGER NOT NULL REFERENCES transferts(id),
  statut TEXT NOT NULL,
  date TEXT NOT NULL,
  source_id INTEGER NOT NULL REFERENCES sources(id),
  est_primaire INTEGER NOT NULL DEFAULT 0,
  origine TEXT NOT NULL CHECK(origine IN ('automatique_api', 'manuel')),
  lien_source TEXT
);

CREATE INDEX IF NOT EXISTS idx_historique_transfert ON historique_statut(transfert_id);
CREATE INDEX IF NOT EXISTS idx_historique_source ON historique_statut(source_id);
CREATE INDEX IF NOT EXISTS idx_transferts_fenetre ON transferts(fenetre_id);
CREATE INDEX IF NOT EXISTS idx_transferts_championnat ON transferts(championnat_id);
CREATE INDEX IF NOT EXISTS idx_clubs_championnat ON clubs(championnat_id);

-- Table opérationnelle (pas exposée à l'app) : suivi du quota et de la rotation
-- de synchronisation pour respecter les limites du plan gratuit.
CREATE TABLE IF NOT EXISTS sync_state (
  cle TEXT PRIMARY KEY,
  valeur TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
