import cron from 'node-cron';
import { synchroniserTransfertsOfficiels } from './apiFootball.sync.js';
import { synchroniserRumeurs } from './sportmonks.sync.js';

async function runSyncCycle() {
  try {
    await synchroniserTransfertsOfficiels();
  } catch (err) {
    console.error('[scheduler] échec sync transferts officiels :', err);
  }
  try {
    await synchroniserRumeurs();
  } catch (err) {
    console.error('[scheduler] échec sync rumeurs :', err);
  }
}

/**
 * Toutes les 4h par défaut — assez espacé pour rester sous les quotas gratuits/
 * bas de gamme tout en couvrant les 5 championnats en quelques passages/jour
 * (la sync des transferts avance par lots, voir apiFootball.sync.ts).
 */
export function demarrerPlanificateur(): void {
  const expression = process.env.SYNC_CRON || '0 */4 * * *';
  console.log(`[scheduler] synchronisation planifiée : "${expression}"`);
  cron.schedule(expression, () => {
    runSyncCycle();
  });

  if (process.env.SYNC_ON_STARTUP !== 'false') {
    console.log('[scheduler] premier passage de synchronisation au démarrage…');
    runSyncCycle();
  }
}
