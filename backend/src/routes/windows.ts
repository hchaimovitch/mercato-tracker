import { Router } from 'express';
import { listFenetres } from '../repo/fenetres.repo.js';
import { toFenetreView } from '../domain/fenetres.js';

export const windowsRouter = Router();

windowsRouter.get('/', (_req, res) => {
  res.json(listFenetres().map((f) => toFenetreView(f)));
});
