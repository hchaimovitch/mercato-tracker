import { createApp } from './app.js';
import { initDb } from './db/client.js';
import { demarrerPlanificateur } from './ingestion/scheduler.js';

async function main() {
  await initDb();

  const port = Number(process.env.PORT) || 4000;
  createApp().listen(port, () => {
    console.log(`Mercato backend listening on http://localhost:${port}`);
  });

  if (process.env.API_FOOTBALL_KEY) {
    demarrerPlanificateur();
  } else {
    console.warn('[startup] API_FOOTBALL_KEY absente — aucune synchronisation ne tournera (base vide). Voir README.');
  }
}

main().catch((err) => {
  console.error('[startup] échec du démarrage :', err);
  process.exit(1);
});
