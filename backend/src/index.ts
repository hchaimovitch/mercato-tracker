import { createApp } from './app.js';
import { demarrerPlanificateur } from './ingestion/scheduler.js';

const port = Number(process.env.PORT) || 4000;
createApp().listen(port, () => {
  console.log(`Mercato backend listening on http://localhost:${port}`);
});

if (process.env.API_FOOTBALL_KEY) {
  demarrerPlanificateur();
} else {
  console.warn('[startup] API_FOOTBALL_KEY absente — aucune synchronisation ne tournera (base vide). Voir README.');
}
