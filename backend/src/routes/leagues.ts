import { Router } from 'express';
import { LEAGUES } from '../data/seed.js';
import { leagueView, leaguesOverview } from '../domain/leagues.js';
import type { LeagueId } from '../types.js';
import { windowFromQuery } from './util.js';

export const leaguesRouter = Router();

leaguesRouter.get('/', (_req, res) => {
  res.json(LEAGUES);
});

leaguesRouter.get('/overview', (req, res) => {
  res.json(leaguesOverview(windowFromQuery(req)));
});

leaguesRouter.get('/:id', (req, res) => {
  const id = req.params.id as LeagueId;
  if (!LEAGUES.some((l) => l.id === id)) {
    res.status(404).json({ error: 'Unknown league' });
    return;
  }
  res.json(leagueView(id, windowFromQuery(req)));
});
