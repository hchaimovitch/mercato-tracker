// Lance un seul passage de synchronisation (transferts officiels + rumeurs si
// configurées) sans démarrer le serveur HTTP ni le planificateur — utile pour
// vérifier ta clé API-Football/SportMonks avant de laisser tourner le service.
import { initDb } from '../db/client.js';
import { synchroniserTransfertsOfficiels } from '../ingestion/apiFootball.sync.js';
import { synchroniserRumeurs } from '../ingestion/sportmonks.sync.js';

async function main() {
  if (!process.env.API_FOOTBALL_KEY) {
    console.error('API_FOOTBALL_KEY manquant — renseigne-le dans backend/.env avant de lancer ce script.');
    process.exit(1);
  }
  await initDb();
  await synchroniserTransfertsOfficiels();
  await synchroniserRumeurs();
  console.log('Terminé.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
