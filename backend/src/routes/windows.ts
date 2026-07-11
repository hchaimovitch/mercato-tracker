import { Router } from 'express';
import { WINDOWS } from '../data/seed.js';

export const windowsRouter = Router();

windowsRouter.get('/', (_req, res) => {
  res.json(WINDOWS);
});
