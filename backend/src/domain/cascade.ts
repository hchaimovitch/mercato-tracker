import { db } from '../db/client.js';
import {
  citationsNonTerminalesPourTransfert,
  historiquePourTransfert,
  transfertsCitantSource,
  ajouterHistorique,
  type NouvelleEntreeHistorique,
} from '../repo/historique.repo.js';
import { getSourceById, incrementerConfirmee, incrementerInfirmee } from '../repo/sources.repo.js';
import { getTransfert, mettreAJourScore, mettreAJourStatut, STATUTS_NON_TERMINAUX } from '../repo/transferts.repo.js';
import type { Origine, Statut } from '../types.js';
import { transferReliability, type CitationSource } from './reliability.js';

/** Recalcule le score de fiabilité d'un transfert en cours à partir de ses citations actuelles. */
export function recalculerScoreTransfert(transfertId: number): number | null {
  const t = getTransfert(transfertId);
  if (!t) return null;
  if (t.statut === 'officiel' || t.statut === 'annule') return t.score_fiabilite;

  const citations = citationsNonTerminalesPourTransfert(transfertId);
  const enrichies: CitationSource[] = citations
    .map((c) => {
      const source = getSourceById(c.source_id);
      if (!source) return null;
      return {
        nomSource: source.nom,
        categorie: source.categorie,
        rumeursConfirmees: source.rumeurs_confirmees,
        rumeursInfirmees: source.rumeurs_infirmees,
        estPrimaire: !!c.est_primaire,
      };
    })
    .filter((c): c is CitationSource => c !== null);

  const score = transferReliability(t.statut, enrichies);
  mettreAJourScore(transfertId, score);
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
 * Pipeline de recalcul en cascade (voir cahier des charges) :
 * 1. le transfert passe à officiel/annulé ;
 * 2. chaque source qui l'avait cité *avant* la résolution voit son compteur
 *    confirmées/infirmées mis à jour (une seule fois par source, idempotent) ;
 * 3. le score des AUTRES transferts encore en cours citant ces mêmes sources
 *    est recalculé (un seul niveau de cascade — pas de récursion).
 */
export function resoudreTransfert(p: ResolutionParams): void {
  const run = db.transaction(() => {
    const t = getTransfert(p.transfertId);
    if (!t) throw new Error(`Transfert ${p.transfertId} introuvable`);
    if (t.statut === p.resolution) return; // déjà résolu — idempotent, pas de double comptage

    const citationsAnterieures = citationsNonTerminalesPourTransfert(p.transfertId);
    const sourcesDistinctes = [...new Set(citationsAnterieures.map((c) => c.source_id))];

    for (const sourceId of sourcesDistinctes) {
      if (p.resolution === 'officiel') incrementerConfirmee(sourceId);
      else incrementerInfirmee(sourceId);
    }

    const entree: NouvelleEntreeHistorique = {
      transfertId: p.transfertId,
      statut: p.resolution,
      date: p.date,
      sourceId: p.sourceId,
      estPrimaire: historiquePourTransfert(p.transfertId).length === 0,
      origine: p.origine,
      lienSource: p.lienSource,
    };
    ajouterHistorique(entree);

    mettreAJourStatut(p.transfertId, p.resolution, p.resolution === 'officiel' ? 100 : null, p.date);

    // Cascade : un seul niveau, sur les transferts encore en cours citant les mêmes sources.
    const autresTransferts = new Set<number>();
    for (const sourceId of sourcesDistinctes) {
      for (const autreId of transfertsCitantSource(sourceId)) {
        if (autreId !== p.transfertId) autresTransferts.add(autreId);
      }
    }
    for (const autreId of autresTransferts) {
      const autre = getTransfert(autreId);
      if (autre && STATUTS_NON_TERMINAUX.includes(autre.statut)) {
        recalculerScoreTransfert(autreId);
      }
    }
  });
  run();
}
