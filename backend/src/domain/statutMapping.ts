import type { Probabilite, Statut } from '../types.js';

/** Ordre d'affichage du stepper (1-6). 'annule' est hors-échelle (traité à part par l'UI). */
export const STATUT_STEP: Record<Exclude<Statut, 'annule'>, number> = {
  rumeur: 1,
  contact_confirme: 2,
  negociation: 3,
  accord_clubs: 4,
  accord_joueur: 5,
  officiel: 6,
};

export const STATUT_LABEL: Record<Statut, string> = {
  rumeur: 'Rumeur',
  contact_confirme: 'Contact confirmé',
  negociation: 'Négociation',
  accord_clubs: 'Accord clubs',
  accord_joueur: 'Accord joueur',
  officiel: 'Officiel',
  annule: 'Annulé',
};

/**
 * Mapping heuristique et documenté : aucune source structurée ne fournit les 6
 * statuts fins. Seule la probabilité à 3 niveaux (SportMonks Transfer Rumours)
 * alimente automatiquement le pipeline ; 'accord_clubs', 'accord_joueur' et
 * 'annule' restent réservés à la curation manuelle (voir routes/curation.ts).
 * Chaque entrée d'historique créée via ce mapping est marquée origine='automatique_api'
 * et reste distinguée dans l'API/l'app d'un statut confirmé.
 */
export function statutDepuisProbabilite(p: Probabilite): Statut {
  if (p === 'LOW') return 'rumeur';
  if (p === 'MEDIUM') return 'contact_confirme';
  return 'negociation';
}
