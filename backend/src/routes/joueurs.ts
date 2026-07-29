import { Router } from 'express';
import { rechercherJoueurs } from '../repo/transferts.repo.js';
import { asyncHandler } from './util.js';

export const joueursRouter = Router();

joueursRouter.get('/', asyncHandler(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) {
    res.json([]);
    return;
  }
  res.json(await rechercherJoueurs(q));
}));
