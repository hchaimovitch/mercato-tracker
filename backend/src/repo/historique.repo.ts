import { db } from '../db/client.js';
import type { HistoriqueStatutRow, Origine, Statut } from '../types.js';

function toHistoriqueRow(r: any): HistoriqueStatutRow {
  return {
    id: Number(r.id), transfert_id: Number(r.transfert_id), statut: r.statut, date: r.date,
    source_id: Number(r.source_id), est_primaire: Number(r.est_primaire), origine: r.origine,
    lien_source: r.lien_source,
  };
}

export interface NouvelleEntreeHistorique {
  transfertId: number;
  statut: Statut;
  date: string;
  sourceId: number;
  estPrimaire: boolean;
  origine: Origine;
  lienSource?: string | null;
}

export async function ajouterHistorique(e: NouvelleEntreeHistorique): Promise<void> {
  await db.execute({
    sql: `INSERT INTO historique_statut (transfert_id, statut, date, source_id, est_primaire, origine, lien_source)
          VALUES (@transfert_id, @statut, @date, @source_id, @est_primaire, @origine, @lien_source)`,
    args: {
      transfert_id: e.transfertId, statut: e.statut, date: e.date, source_id: e.sourceId,
      est_primaire: e.estPrimaire ? 1 : 0, origine: e.origine, lien_source: e.lienSource ?? null,
    },
  });
}

export async function historiquePourTransfert(transfertId: number): Promise<HistoriqueStatutRow[]> {
  const rs = await db.execute({ sql: 'SELECT * FROM historique_statut WHERE transfert_id = @transfert_id ORDER BY date ASC', args: { transfert_id: transfertId } });
  return rs.rows.map(toHistoriqueRow);
}

/** Citations antérieures à la résolution (rumeur → ...) — les "prédictions" notées lors du recalcul en cascade. */
export async function citationsNonTerminalesPourTransfert(transfertId: number): Promise<HistoriqueStatutRow[]> {
  const rs = await db.execute({
    sql: "SELECT * FROM historique_statut WHERE transfert_id = @transfert_id AND statut NOT IN ('officiel','annule') ORDER BY date ASC",
    args: { transfert_id: transfertId },
  });
  return rs.rows.map(toHistoriqueRow);
}

export async function transfertsCitantSource(sourceId: number): Promise<number[]> {
  const rs = await db.execute({ sql: 'SELECT DISTINCT transfert_id FROM historique_statut WHERE source_id = @source_id', args: { source_id: sourceId } });
  return rs.rows.map((r: any) => Number(r.transfert_id));
}
