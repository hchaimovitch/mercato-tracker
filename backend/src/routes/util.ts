import type { Request } from 'express';
import { getFenetre, listFenetres } from '../repo/fenetres.repo.js';
import type { FenetreRow } from '../types.js';

export function fenetreFromQuery(req: Request): FenetreRow {
  const raw = typeof req.query.window === 'string' ? req.query.window : undefined;
  const found = raw ? getFenetre(raw) : undefined;
  return found ?? listFenetres()[0];
}
