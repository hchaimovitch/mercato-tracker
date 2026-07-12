import { Router } from 'express';
import { sourceProfileView } from '../domain/sourceProfile.js';

export const sourcesRouter = Router();

sourcesRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const profile = sourceProfileView(id);
  if (!profile) {
    res.status(404).json({ error: 'Unknown source' });
    return;
  }
  res.json(profile);
});
