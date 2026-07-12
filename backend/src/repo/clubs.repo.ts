import { db } from '../db/client.js';
import type { ClubRow, LeagueId } from '../types.js';

/** Ancre FK pour un club hors Big 5 (l'autre bout d'un transfert transfrontalier) — jamais exposé à l'app. */
export const LIGUE_EXTERNE = 'ext';

const stmtById = db.prepare<{ id: number }, ClubRow>('SELECT * FROM clubs WHERE id = @id');
const stmtByApiFootballId = db.prepare<{ id: number }, ClubRow>('SELECT * FROM clubs WHERE api_football_id = @id');
const stmtByLeague = db.prepare<{ championnat_id: string }, ClubRow>(
  'SELECT * FROM clubs WHERE championnat_id = @championnat_id ORDER BY nom',
);
const stmtInsert = db.prepare<{ nom: string; championnat_id: string; couleur: string; abbr: string; api_football_id: number | null }>(
  'INSERT INTO clubs (nom, championnat_id, couleur, abbr, api_football_id) VALUES (@nom, @championnat_id, @couleur, @abbr, @api_football_id)',
);

export function getClub(id: number): ClubRow | undefined {
  return stmtById.get({ id });
}

export function getClubByApiFootballId(id: number): ClubRow | undefined {
  return stmtByApiFootballId.get({ id });
}

export function listClubsByLeague(championnatId: LeagueId): ClubRow[] {
  return stmtByLeague.all({ championnat_id: championnatId });
}

const stmtAllBig5 = db.prepare<[], ClubRow>(`SELECT * FROM clubs WHERE championnat_id != '${LIGUE_EXTERNE}' ORDER BY nom`);

export function listerClubsBig5(): ClubRow[] {
  return stmtAllBig5.all();
}

/** Couleur d'affichage assignée déterministiquement (pas de vrai logo — badge initiales, cf. décision produit). */
const PALETTE = ['#b0392b', '#3a4550', '#6a8ac0', '#2f8a9a', '#2a3a6a', '#2f7fb0', '#4a6a8a', '#b03535', '#8a3a3a', '#c9a227', '#a03030', '#c04a4a', '#a0402f', '#8a4a4a', '#4d4d4d', '#3a6a4a', '#b03030'];

export function upsertClubFromApiFootball(nom: string, championnatId: string, apiFootballId: number): ClubRow {
  const existing = getClubByApiFootballId(apiFootballId);
  if (existing) return existing;
  const abbr = nom
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
  const couleur = PALETTE[apiFootballId % PALETTE.length];
  stmtInsert.run({ nom, championnat_id: championnatId, couleur, abbr, api_football_id: apiFootballId });
  return getClubByApiFootballId(apiFootballId)!;
}

/** Résout (ou crée à la volée) le club de l'autre bout d'un transfert transfrontalier, hors Big 5. */
export function resoudreOuCreerClubExterne(apiFootballId: number, nom: string): ClubRow {
  return upsertClubFromApiFootball(nom, LIGUE_EXTERNE, apiFootballId);
}

function normaliserNomClub(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\b(fc|cf|sc|afc|calcio|club)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Correspondance par nom normalisé — nécessaire car SportMonks utilise un espace
 * d'identifiants de clubs différent d'API-Football (pas d'ID commun entre
 * fournisseurs). Limite connue et documentée : une variante de nom trop
 * éloignée (ex: abréviation inhabituelle) peut ne pas matcher et fera ignorer
 * la rumeur plutôt que de risquer une fausse correspondance.
 */
export function trouverClubBig5ParNom(nom: string): ClubRow | undefined {
  const cible = normaliserNomClub(nom);
  return listerClubsBig5().find((c) => normaliserNomClub(c.nom) === cible);
}

export function enregistrerSportmonksId(clubId: number, sportmonksId: number): void {
  db.prepare('UPDATE clubs SET sportmonks_id = ? WHERE id = ?').run(sportmonksId, clubId);
}
