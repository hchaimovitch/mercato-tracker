import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getFenetre, listFenetres } from '../repo/fenetres.repo.js';
import type { FenetreRow } from '../types.js';

export async function fenetreFromQuery(req: Request): Promise<FenetreRow> {
  const raw = typeof req.query.window === 'string' ? req.query.window : undefined;
  const found = raw ? await getFenetre(raw) : undefined;
  return found ?? (await listFenetres())[0];
}

/** Express 4 ne rattrape pas les rejets de promesses dans les handlers async — ce wrapper le fait. */
export function asyncHandler(fn: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}
