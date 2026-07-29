import { Router } from 'express';
import { listLeagues } from '../repo/leagues.repo.js';
import { getTransfert, listerParFenetre, STATUTS_NON_TERMINAUX } from '../repo/transferts.repo.js';
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

  // 'officiel' = transfert confirmé, 'rumeur' = encore en cours (tout statut hors
  // officiel/annulé, voir STATUTS_NON_TERMINAUX) — un transfert annulé n'est ni
  // l'un ni l'autre, donc absent des deux filtres (visible seulement en "Tous").
  const typeRaw = typeof req.query.type === 'string' ? req.query.type : undefined;

  const rows = await listerParFenetre(fenetre.id, league);
  const filtered = typeRaw === 'officiel'
    ? rows.filter((r) => r.statut === 'officiel')
    : typeRaw === 'rumeur'
      ? rows.filter((r) => (STATUTS_NON_TERMINAUX as string[]).includes(r.statut))
      : rows;
  const items = await Promise.all(filtered.map(toCard));
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
