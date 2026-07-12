import type { SourceCategorie, Statut } from '../types.js';
import { wilsonLowerBound } from './wilson.js';

/**
 * Poids par catégorie de source — reflète le poids de crédibilité éditoriale,
 * pas une mesure statistique. Valeurs choisies raisonnablement, documentées ici
 * pour rester ajustables (pas cachées dans une formule opaque).
 */
export const POIDS_CATEGORIE: Record<SourceCategorie, number> = {
  club_officiel: 1.0,
  journaliste_reconnu: 0.9,
  media_generaliste: 0.7,
  non_verifie: 0.4,
};

/** Une source neuve (n=0, aucun historique) démarre sur ce prior neutre plutôt qu'un score inventé. */
export const PRIOR_NEUTRE = 0.5;

/** Poids relatif d'une citation primaire vs relais dans la moyenne pondérée. */
export const POIDS_PRIMAIRE = 1.5;
export const POIDS_RELAIS = 1.0;

/** Bonus de corroboration par source indépendante supplémentaire au-delà de la première, plafonné. */
export const BONUS_PAR_SOURCE = 0.05;
export const BONUS_MAX = 0.15;

export interface CitationSource {
  nomSource: string;
  categorie: SourceCategorie;
  rumeursConfirmees: number;
  rumeursInfirmees: number;
  estPrimaire: boolean;
}

/**
 * Score de fiabilité d'un transfert (0-100) :
 * - 'officiel' : confirmé par une source officielle en amont du pipeline → 100.
 * - 'annule' : la transaction n'a pas eu lieu, le score n'a plus de sens → null.
 * - sinon : moyenne pondérée (catégorie × primaire/relais) des scores de Wilson
 *   des sources citées (prior neutre 0.5 si une source n'a encore aucun
 *   historique), plus un bonus de corroboration par source indépendante
 *   supplémentaire (plafonné), normalisée sur 100.
 */
export function transferReliability(statut: Statut, citations: CitationSource[]): number | null {
  if (statut === 'officiel') return 100;
  if (statut === 'annule') return null;
  if (citations.length === 0) return null;

  let sommePonderee = 0;
  let sommePoids = 0;
  for (const c of citations) {
    const wilson = wilsonLowerBound(c.rumeursConfirmees, c.rumeursInfirmees);
    const scoreSource = wilson ?? PRIOR_NEUTRE;
    const poidsCitation = (c.estPrimaire ? POIDS_PRIMAIRE : POIDS_RELAIS) * POIDS_CATEGORIE[c.categorie];
    sommePonderee += scoreSource * poidsCitation;
    sommePoids += poidsCitation;
  }
  const base = sommePoids > 0 ? sommePonderee / sommePoids : PRIOR_NEUTRE;

  const sourcesIndependantes = new Set(citations.map((c) => c.nomSource)).size;
  const bonus = Math.min(BONUS_MAX, BONUS_PAR_SOURCE * Math.max(0, sourcesIndependantes - 1));

  return Math.round(Math.min(1, base + bonus) * 100);
}
