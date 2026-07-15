import { Router } from 'express';
import { listLeagues } from '../repo/leagues.repo.js';
import { leagueView, leaguesOverview } from '../domain/leagueViews.js';
import type { LeagueId } from '../types.js';
import { asyncHandler, fenetreFromQuery } from './util.js';

export const leaguesRouter = Router();

leaguesRouter.get('/', asyncHandler(async (_req, res) => {
  res.json((await listLeagues()).map((l) => ({ id: l.id, name: l.nom, short: l.code_court, color: l.couleur })));
}));

leaguesRouter.get('/overview', asyncHandler(async (req, res) => {
  const fenetre = await fenetreFromQuery(req);
  res.json(await leaguesOverview(fenetre.id));
}));

leaguesRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as LeagueId;
  const leagues = await listLeagues();
  if (!leagues.some((l) => l.id === id)) {
    res.status(404).json({ error: 'Unknown league' });
    return;
  }
  const fenetre = await fenetreFromQuery(req);
  res.json(await leagueView(id, fenetre.id));
}));
