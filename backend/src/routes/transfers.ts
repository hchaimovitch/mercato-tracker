import { Router } from 'express';
import { LEAGUES } from '../data/seed.js';
import { buildDetail, cardsByIds, findTransfer, getFeed } from '../domain/transfers.js';
import type { LeagueId } from '../types.js';
import { windowFromQuery } from './util.js';

export const transfersRouter = Router();

transfersRouter.get('/', (req, res) => {
  const idsRaw = typeof req.query.ids === 'string' ? req.query.ids : undefined;
  if (idsRaw !== undefined) {
    const ids = idsRaw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    res.json(cardsByIds(ids));
    return;
  }

  const window = windowFromQuery(req);
  const leagueRaw = typeof req.query.league === 'string' ? req.query.league : undefined;
  const league = LEAGUES.some((l) => l.id === leagueRaw) ? (leagueRaw as LeagueId) : undefined;
  res.json(getFeed(window, league));
});

transfersRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const t = findTransfer(id);
  if (!t) {
    res.status(404).json({ error: 'Unknown transfer' });
    return;
  }
  res.json(buildDetail(t));
});
