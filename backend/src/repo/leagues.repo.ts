import { db } from '../db/client.js';
import type { LeagueId, LeagueRow } from '../types.js';

function toLeagueRow(r: any): LeagueRow {
  return {
    id: r.id, nom: r.nom, code_court: r.code_court, couleur: r.couleur,
    api_football_id: r.api_football_id === null ? null : Number(r.api_football_id),
    sportmonks_id: r.sportmonks_id === null ? null : Number(r.sportmonks_id),
  };
}

export async function listLeagues(): Promise<LeagueRow[]> {
  const rs = await db.execute('SELECT * FROM leagues ORDER BY nom');
  return rs.rows.map(toLeagueRow);
}

export async function getLeague(id: LeagueId): Promise<LeagueRow | undefined> {
  const rs = await db.execute({ sql: 'SELECT * FROM leagues WHERE id = @id', args: { id } });
  return rs.rows[0] ? toLeagueRow(rs.rows[0]) : undefined;
}
