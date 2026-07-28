import { Router } from 'express';
import { getClub, listerClubsBig5 } from '../repo/clubs.repo.js';
import { clubView } from '../domain/leagueViews.js';
import { asyncHandler, fenetreFromQuery } from './util.js';

export const clubsRouter = Router();

/** Liste légère de tous les clubs Big 5 — sert le sélecteur de club dans l'écran Alertes. */
clubsRouter.get('/', asyncHandler(async (_req, res) => {
  const clubs = await listerClubsBig5();
  res.json(clubs.map((c) => ({
    id: c.id, nom: c.nom, abbr: c.abbr, couleur: c.couleur, logoUrl: c.logo_url, championnatId: c.championnat_id,
  })));
}));

clubsRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!(await getClub(id))) {
    res.status(404).json({ error: 'Unknown club' });
    return;
  }
  const fenetre = await fenetreFromQuery(req);
  res.json(await clubView(id, fenetre.id));
}));
