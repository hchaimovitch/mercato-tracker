import cors from 'cors';
import express from 'express';
import { clubsRouter } from './routes/clubs.js';
import { leaguesRouter } from './routes/leagues.js';
import { sourcesRouter } from './routes/sources.js';
import { transfersRouter } from './routes/transfers.js';
import { windowsRouter } from './routes/windows.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/windows', windowsRouter);
  app.use('/leagues', leaguesRouter);
  app.use('/clubs', clubsRouter);
  app.use('/transfers', transfersRouter);
  app.use('/sources', sourcesRouter);

  return app;
}
