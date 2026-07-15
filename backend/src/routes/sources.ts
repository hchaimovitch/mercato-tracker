import { Router } from 'express';
import { sourceProfileView } from '../domain/sourceProfile.js';
import { asyncHandler } from './util.js';

export const sourcesRouter = Router();

sourcesRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const profile = await sourceProfileView(id);
  if (!profile) {
    res.status(404).json({ error: 'Unknown source' });
    return;
  }
  res.json(profile);
}));
