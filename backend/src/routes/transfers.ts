import { Router } from 'express';
import { listLeagues } from '../repo/leagues.repo.js';
import { getTransfert, listerParFenetre } from '../repo/transferts.repo.js';
import { buildDetail, toCard } from '../domain/views.js';
import type { LeagueId } from '../types.js';
import { asyncHandler, fenetreFromQuery } from './util.js';

export const transfersRouter = Router();

transfersRouter.get('/', asyncHandler(async (req, res) => {
  const fenetre = await fenetreFromQuery(req);

  const idsRaw = typeof req.query.ids === 'string' ? req.query.ids : undefined;
  if (idsRaw !== undefined) {
    const ids = idsRaw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
    const found = (await Promise.all(ids.map((id) => getTransfert(id)))).filter((t): t is NonNullable<typeof t> => !!t);
    const cards = await Promise.all(found.map(toCard));
    res.json(cards);
    return;
  }

  const leagueRaw = typeof req.query.league === 'string' ? req.query.league : undefined;
  const leagues = await listLeagues();
  const league = leagues.some((l) => l.id === leagueRaw) ? (leagueRaw as LeagueId) : undefined;

  const rows = await listerParFenetre(fenetre.id, league);
  const items = await Promise.all(rows.map(toCard));
  // à la une d'abord (montant >= 60M), puis le reste — tri stable
  items.sort((a, b) => Number(b.breaking) - Number(a.breaking));
  res.json(items);
}));

transfersRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const t = await getTransfert(id);
  if (!t) {
    res.status(404).json({ error: 'Unknown transfer' });
    return;
  }
  res.json(await buildDetail(t));
}));
