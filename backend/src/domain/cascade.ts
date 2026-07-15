import {
  citationsNonTerminalesPourTransfert,
  historiquePourTransfert,
  transfertsCitantSource,
  ajouterHistorique,
} from '../repo/historique.repo.js';
import { getSourceById, incrementerConfirmee, incrementerInfirmee } from '../repo/sources.repo.js';
import { getTransfert, mettreAJourScore, mettreAJourStatut, STATUTS_NON_TERMINAUX } from '../repo/transferts.repo.js';
import type { Origine, Statut } from '../types.js';
import { transferReliability, type CitationSource } from './reliability.js';

/** Recalcule le score de fiabilité d'un transfert en cours à partir de ses citations actuelles. */
export async function recalculerScoreTransfert(transfertId: number): Promise<number | null> {
  const t = await getTransfert(transfertId);
  if (!t) return null;
  if (t.statut === 'officiel' || t.statut === 'annule') return t.score_fiabilite;

  const citations = await citationsNonTerminalesPourTransfert(transfertId);
  const enrichies: CitationSource[] = [];
  for (const c of citations) {
    const source = await getSourceById(c.source_id);
    if (!source) continue;
    enrichies.push({
      nomSource: source.nom, categorie: source.categorie,
      rumeursConfirmees: source.rumeurs_confirmees, rumeursInfirmees: source.rumeurs_infirmees,
      estPrimaire: !!c.est_primaire,
    });
  }

  const score = transferReliability(t.statut, enrichies);
  await mettreAJourScore(transfertId, score);
  return score;
}

export interface ResolutionParams {
  transfertId: number;
  resolution: Extract<Statut, 'officiel' | 'annule'>;
  date: string;
  sourceId: number;
  origine: Origine;
  lienSource?: string | null;
}

/**
 * Pipeline de recalcul en cascade :
 * 1. le transfert passe à officiel/annulé ;
 * 2. chaque source qui l'avait cité *avant* la résolution voit son compteur
 *    confirmées/infirmées mis à jour (une seule fois par source, idempotent) ;
 * 3. le score des AUTRES transferts encore en cours citant ces mêmes sources
 *    est recalculé (un seul niveau de cascade — pas de récursion).
 *
 * Note : sur une base distante (Turso), ces écritures ne sont volontairement
 * pas regroupées dans une transaction interactive (ça demanderait de faire
 * passer l'objet Transaction dans toute la couche repo pour un gain marginal
 * ici) — usage mono-écrivain à faible trafic, le risque d'état partiel en cas
 * de coupure réseau en plein milieu est jugé acceptable pour ce projet.
 */
export async function resoudreTransfert(p: ResolutionParams): Promise<void> {
  const t = await getTransfert(p.transfertId);
  if (!t) throw new Error(`Transfert ${p.transfertId} introuvable`);
  if (t.statut === p.resolution) return; // déjà résolu — idempotent, pas de double comptage

  const citationsAnterieures = await citationsNonTerminalesPourTransfert(p.transfertId);
  const sourcesDistinctes = [...new Set(citationsAnterieures.map((c) => c.source_id))];

  for (const sourceId of sourcesDistinctes) {
    if (p.resolution === 'officiel') await incrementerConfirmee(sourceId);
    else await incrementerInfirmee(sourceId);
  }

  const historiqueExistant = await historiquePourTransfert(p.transfertId);
  await ajouterHistorique({
    transfertId: p.transfertId,
    statut: p.resolution,
    date: p.date,
    sourceId: p.sourceId,
    estPrimaire: historiqueExistant.length === 0,
    origine: p.origine,
    lienSource: p.lienSource,
  });

  await mettreAJourStatut(p.transfertId, p.resolution, p.resolution === 'officiel' ? 100 : null, p.date);

  // Cascade : un seul niveau, sur les transferts encore en cours citant les mêmes sources.
  const autresTransferts = new Set<number>();
  for (const sourceId of sourcesDistinctes) {
    for (const autreId of await transfertsCitantSource(sourceId)) {
      if (autreId !== p.transfertId) autresTransferts.add(autreId);
    }
  }
  for (const autreId of autresTransferts) {
    const autre = await getTransfert(autreId);
    if (autre && STATUTS_NON_TERMINAUX.includes(autre.statut)) {
      await recalculerScoreTransfert(autreId);
    }
  }
}
