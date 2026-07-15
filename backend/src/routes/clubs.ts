import { Router } from 'express';
import { getClub } from '../repo/clubs.repo.js';
import { clubView } from '../domain/leagueViews.js';
import { asyncHandler, fenetreFromQuery } from './util.js';

export const clubsRouter = Router();

clubsRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!(await getClub(id))) {
    res.status(404).json({ error: 'Unknown club' });
    return;
  }
  const fenetre = await fenetreFromQuery(req);
  res.json(await clubView(id, fenetre.id));
}));
