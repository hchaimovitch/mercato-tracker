import { Router } from 'express';
import { CLUBS } from '../data/seed.js';
import { clubView } from '../domain/leagues.js';
import { windowFromQuery } from './util.js';

export const clubsRouter = Router();

clubsRouter.get('/:abbr', (req, res) => {
  const abbr = req.params.abbr.toUpperCase();
  if (!CLUBS[abbr]) {
    res.status(404).json({ error: 'Unknown club' });
    return;
  }
  res.json(clubView(abbr, windowFromQuery(req)));
});
