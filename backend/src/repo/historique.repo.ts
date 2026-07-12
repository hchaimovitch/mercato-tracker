import { db } from '../db/client.js';
import type { HistoriqueStatutRow, Origine, Statut } from '../types.js';

const stmtInsert = db.prepare<{
  transfert_id: number;
  statut: Statut;
  date: string;
  source_id: number;
  est_primaire: number;
  origine: Origine;
  lien_source: string | null;
}>(
  `INSERT INTO historique_statut (transfert_id, statut, date, source_id, est_primaire, origine, lien_source)
   VALUES (@transfert_id, @statut, @date, @source_id, @est_primaire, @origine, @lien_source)`,
);

const stmtByTransfert = db.prepare<{ transfert_id: number }, HistoriqueStatutRow>(
  'SELECT * FROM historique_statut WHERE transfert_id = @transfert_id ORDER BY date ASC',
);

const stmtNonTerminalesByTransfert = db.prepare<{ transfert_id: number }, HistoriqueStatutRow>(
  "SELECT * FROM historique_statut WHERE transfert_id = @transfert_id AND statut NOT IN ('officiel','annule') ORDER BY date ASC",
);

const stmtTransfertsCitantSource = db.prepare<{ source_id: number }, { transfert_id: number }>(
  'SELECT DISTINCT transfert_id FROM historique_statut WHERE source_id = @source_id',
);

export interface NouvelleEntreeHistorique {
  transfertId: number;
  statut: Statut;
  date: string;
  sourceId: number;
  estPrimaire: boolean;
  origine: Origine;
  lienSource?: string | null;
}

export function ajouterHistorique(e: NouvelleEntreeHistorique): void {
  stmtInsert.run({
    transfert_id: e.transfertId,
    statut: e.statut,
    date: e.date,
    source_id: e.sourceId,
    est_primaire: e.estPrimaire ? 1 : 0,
    origine: e.origine,
    lien_source: e.lienSource ?? null,
  });
}

export function historiquePourTransfert(transfertId: number): HistoriqueStatutRow[] {
  return stmtByTransfert.all({ transfert_id: transfertId });
}

/** Citations antérieures à la résolution (rumeur → ... ) — ce sont les "prédictions" notées lors du recalcul en cascade. */
export function citationsNonTerminalesPourTransfert(transfertId: number): HistoriqueStatutRow[] {
  return stmtNonTerminalesByTransfert.all({ transfert_id: transfertId });
}

export function transfertsCitantSource(sourceId: number): number[] {
  return stmtTransfertsCitantSource.all({ source_id: sourceId }).map((r) => r.transfert_id);
}
