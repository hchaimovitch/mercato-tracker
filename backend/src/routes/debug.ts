import { Router } from 'express';
import { db } from '../db/client.js';
import { asyncHandler } from './util.js';

// Route de diagnostic temporaire — à retirer une fois le premier déploiement stabilisé.
export const debugRouter = Router();

debugRouter.get('/state', asyncHandler(async (_req, res) => {
  const leagues = await db.execute('SELECT * FROM leagues');
  const clubCount = await db.execute('SELECT COUNT(*) as n FROM clubs');
  const syncState = await db.execute('SELECT * FROM sync_state');
  const fenetres = await db.execute('SELECT * FROM fenetres');
  const transfertsParStatut = await db.execute('SELECT statut, COUNT(*) as n FROM transferts GROUP BY statut');
  const transfertsAvecMontantChiffre = await db.execute("SELECT COUNT(*) as n FROM transferts WHERE montant GLOB '*[0-9]*'");
  const transfertsSansMontantChiffre = await db.execute("SELECT COUNT(*) as n FROM transferts WHERE montant IS NULL OR montant NOT GLOB '*[0-9]*'");
  res.json({
    leagues: leagues.rows,
    clubCount: clubCount.rows[0],
    syncState: syncState.rows,
    fenetres: fenetres.rows,
    transfertsParStatut: transfertsParStatut.rows,
    transfertsAvecMontantChiffre: transfertsAvecMontantChiffre.rows[0],
    transfertsSansMontantChiffre: transfertsSansMontantChiffre.rows[0],
  });
}));
