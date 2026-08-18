import { db } from '../db/client.js';
import type { ClubRow, LeagueId } from '../types.js';

/** Ancre pour un club hors Big 5 (l'autre bout d'un transfert transfrontalier) — jamais exposé à l'app. */
export const LIGUE_EXTERNE = 'ext';

function toClubRow(r: any): ClubRow {
  return {
    id: Number(r.id), nom: r.nom, championnat_id: r.championnat_id, couleur: r.couleur, abbr: r.abbr,
    api_football_id: r.api_football_id === null ? null : Number(r.api_football_id),
    sportmonks_id: r.sportmonks_id === null ? null : Number(r.sportmonks_id),
    logo_url: r.logo_url ?? null,
  };
}

export async function getClub(id: number): Promise<ClubRow | undefined> {
  const rs = await db.execute({ sql: 'SELECT * FROM clubs WHERE id = @id', args: { id } });
  return rs.rows[0] ? toClubRow(rs.rows[0]) : undefined;
}

export async function getClubByApiFootballId(id: number): Promise<ClubRow | undefined> {
  const rs = await db.execute({ sql: 'SELECT * FROM clubs WHERE api_football_id = @id', args: { id } });
  return rs.rows[0] ? toClubRow(rs.rows[0]) : undefined;
}

export async function listClubsByLeague(championnatId: LeagueId): Promise<ClubRow[]> {
  const rs = await db.execute({ sql: 'SELECT * FROM clubs WHERE championnat_id = @championnat_id ORDER BY nom', args: { championnat_id: championnatId } });
  return rs.rows.map(toClubRow);
}

export async function listerClubsBig5(): Promise<ClubRow[]> {
  const rs = await db.execute({ sql: 'SELECT * FROM clubs WHERE championnat_id != @ext ORDER BY nom', args: { ext: LIGUE_EXTERNE } });
  return rs.rows.map(toClubRow);
}

/** Big 5 + clubs hors Big 5 déjà connus (créés côté API-Football) — voir transfermarktDataset.ts. */
export async function listerTousLesClubs(): Promise<ClubRow[]> {
  const rs = await db.execute('SELECT * FROM clubs ORDER BY nom');
  return rs.rows.map(toClubRow);
}

/**
 * Couleur d'affichage assignée déterministiquement — sert de fallback pour le
 * badge à initiales quand aucun logo n'est disponible (usage strictement
 * personnel, jamais publié/distribué — voir README pour le contexte de cette
 * décision sur les logos de clubs).
 */
const PALETTE = ['#b0392b', '#3a4550', '#6a8ac0', '#2f8a9a', '#2a3a6a', '#2f7fb0', '#4a6a8a', '#b03535', '#8a3a3a', '#c9a227', '#a03030', '#c04a4a', '#a0402f', '#8a4a4a', '#4d4d4d', '#3a6a4a', '#b03030'];

export async function upsertClubFromApiFootball(nom: string, championnatId: string, apiFootballId: number, logoUrl: string | null = null): Promise<ClubRow> {
  const existing = await getClubByApiFootballId(apiFootballId);
  if (existing) {
    // Rattrape le logo pour les clubs déjà synchronisés avant l'ajout de ce champ.
    if (logoUrl && existing.logo_url !== logoUrl) {
      await db.execute({ sql: 'UPDATE clubs SET logo_url = @logo_url WHERE id = @id', args: { logo_url: logoUrl, id: existing.id } });
      return { ...existing, logo_url: logoUrl };
    }
    return existing;
  }
  const abbr = nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();
  const couleur = PALETTE[apiFootballId % PALETTE.length];
  await db.execute({
    sql: 'INSERT INTO clubs (nom, championnat_id, couleur, abbr, api_football_id, logo_url) VALUES (@nom, @championnat_id, @couleur, @abbr, @api_football_id, @logo_url)',
    args: { nom, championnat_id: championnatId, couleur, abbr, api_football_id: apiFootballId, logo_url: logoUrl },
  });
  return (await getClubByApiFootballId(apiFootballId))!;
}

/** Résout (ou crée à la volée) le club de l'autre bout d'un transfert transfrontalier, hors Big 5 — pas de logo disponible via /transfers. */
/**
 * L'autre club d'un transfert transfrontalier n'est jamais découvert via /teams (réservé
 * au Big 5), donc jamais de champ `logo` fourni directement par l'API pour lui — mais
 * API-Football documente une URL de logo prévisible, construite à partir du seul id
 * d'équipe (https://www.api-football.com/documentation-v3), le même hôte CDN que celui
 * déjà utilisé pour les clubs du Big 5. Couvre ainsi tout club hors Big 5 (Portugal,
 * Turquie, Pays-Bas, Belgique, Suisse, Russie, D2 des 5 grands championnats, etc.) sans
 * avoir à répertorier un par un les championnats concernés.
 */
export async function resoudreOuCreerClubExterne(apiFootballId: number, nom: string): Promise<ClubRow> {
  const logoUrl = `https://media.api-sports.io/football/teams/${apiFootballId}.png`;
  return upsertClubFromApiFootball(nom, LIGUE_EXTERNE, apiFootballId, logoUrl);
}

export function normaliserNomClub(nom: string): string {
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
export async function trouverClubBig5ParNom(nom: string): Promise<ClubRow | undefined> {
  const cible = normaliserNomClub(nom);
  const clubs = await listerClubsBig5();
  return clubs.find((c) => normaliserNomClub(c.nom) === cible);
}

export async function enregistrerSportmonksId(clubId: number, sportmonksId: number): Promise<void> {
  await db.execute({ sql: 'UPDATE clubs SET sportmonks_id = @sportmonks_id WHERE id = @id', args: { sportmonks_id: sportmonksId, id: clubId } });
}
