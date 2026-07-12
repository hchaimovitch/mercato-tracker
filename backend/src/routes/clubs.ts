import { Router } from 'express';
import { getClub } from '../repo/clubs.repo.js';
import { clubView } from '../domain/leagueViews.js';
import { fenetreFromQuery } from './util.js';

export const clubsRouter = Router();

clubsRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!getClub(id)) {
    res.status(404).json({ error: 'Unknown club' });
    return;
  }
  res.json(clubView(id, fenetreFromQuery(req).id));
});
