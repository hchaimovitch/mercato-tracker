import { Router } from 'express';
import { listLeagues } from '../repo/leagues.repo.js';
import { getTransfert, listerParFenetre } from '../repo/transferts.repo.js';
import { buildDetail, toCard } from '../domain/views.js';
import type { LeagueId } from '../types.js';
import { fenetreFromQuery } from './util.js';

export const transfersRouter = Router();

transfersRouter.get('/', (req, res) => {
  const fenetre = fenetreFromQuery(req);

  const idsRaw = typeof req.query.ids === 'string' ? req.query.ids : undefined;
  if (idsRaw !== undefined) {
    const ids = idsRaw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
    const cards = ids.map((id) => getTransfert(id)).filter((t): t is NonNullable<typeof t> => !!t).map(toCard);
    res.json(cards);
    return;
  }

  const leagueRaw = typeof req.query.league === 'string' ? req.query.league : undefined;
  const league = listLeagues().some((l) => l.id === leagueRaw) ? (leagueRaw as LeagueId) : undefined;

  const items = listerParFenetre(fenetre.id, league).map(toCard);
  // à la une d'abord (montant >= 60M), puis le reste — tri stable
  items.sort((a, b) => Number(b.breaking) - Number(a.breaking));
  res.json(items);
});

transfersRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const t = getTransfert(id);
  if (!t) {
    res.status(404).json({ error: 'Unknown transfer' });
    return;
  }
  res.json(buildDetail(t));
});
