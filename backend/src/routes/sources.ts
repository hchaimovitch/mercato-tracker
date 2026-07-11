import { Router } from 'express';
import { sourceProfile } from '../domain/sources.js';

export const sourcesRouter = Router();

sourcesRouter.get('/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const isOfficial = req.query.official === 'true';
  res.json(sourceProfile(name, isOfficial));
});
