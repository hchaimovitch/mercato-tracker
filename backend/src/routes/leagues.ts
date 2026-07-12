import { Router } from 'express';
import { listLeagues } from '../repo/leagues.repo.js';
import { leagueView, leaguesOverview } from '../domain/leagueViews.js';
import type { LeagueId } from '../types.js';
import { fenetreFromQuery } from './util.js';

export const leaguesRouter = Router();

leaguesRouter.get('/', (_req, res) => {
  res.json(listLeagues().map((l) => ({ id: l.id, name: l.nom, short: l.code_court, color: l.couleur })));
});

leaguesRouter.get('/overview', (req, res) => {
  res.json(leaguesOverview(fenetreFromQuery(req).id));
});

leaguesRouter.get('/:id', (req, res) => {
  const id = req.params.id as LeagueId;
  if (!listLeagues().some((l) => l.id === id)) {
    res.status(404).json({ error: 'Unknown league' });
    return;
  }
  res.json(leagueView(id, fenetreFromQuery(req).id));
});
