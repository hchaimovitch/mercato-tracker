import { Router } from 'express';
import { listFenetres } from '../repo/fenetres.repo.js';
import { toFenetreView } from '../domain/fenetres.js';
import { asyncHandler } from './util.js';

export const windowsRouter = Router();

windowsRouter.get('/', asyncHandler(async (_req, res) => {
  res.json((await listFenetres()).map((f) => toFenetreView(f)));
}));
