import cors from 'cors';
import express from 'express';
import { alertesRouter } from './routes/alertes.js';
import { clubsRouter } from './routes/clubs.js';
import { curationRouter } from './routes/curation.js';
import { debugRouter } from './routes/debug.js';
import { leaguesRouter } from './routes/leagues.js';
import { sourcesRouter } from './routes/sources.js';
import { transfersRouter } from './routes/transfers.js';
import { windowsRouter } from './routes/windows.js';
import { isSportmonksActif } from './ingestion/sportmonks.client.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true, rumeursActives: isSportmonksActif() }));
  app.use('/windows', windowsRouter);
  app.use('/leagues', leaguesRouter);
  app.use('/clubs', clubsRouter);
  app.use('/transfers', transfersRouter);
  app.use('/sources', sourcesRouter);
  app.use('/curation', curationRouter);
  app.use('/debug', debugRouter);
  app.use('/alertes', alertesRouter);

  return app;
}
