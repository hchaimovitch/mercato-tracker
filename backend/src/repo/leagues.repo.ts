import { db } from '../db/client.js';
import type { LeagueId, LeagueRow } from '../types.js';

const stmtAll = db.prepare<[], LeagueRow>('SELECT * FROM leagues ORDER BY nom');
const stmtGetById = db.prepare<{ id: string }, LeagueRow>('SELECT * FROM leagues WHERE id = @id');

export function listLeagues(): LeagueRow[] {
  return stmtAll.all();
}

export function getLeague(id: LeagueId): LeagueRow | undefined {
  return stmtGetById.get({ id });
}
