import type { SourceCategorie } from '../types.js';

/**
 * Catalogue curaté manuellement — l'API de rumeurs renvoie un nom de source en
 * texte libre, jamais une catégorie. Toute source absente de cette liste est
 * classée 'non_verifie' par défaut (le plus prudent), plutôt que de lui prêter
 * une crédibilité non vérifiée. Liste ajustable au fil du temps.
 */
const CATALOGUE_SOURCES: Record<string, SourceCategorie> = {
  'fabrizio romano': 'journaliste_reconnu',
  'david ornstein': 'journaliste_reconnu',
  'gianluca di marzio': 'journaliste_reconnu',
  'florian plettenberg': 'journaliste_reconnu',
  'sky sports': 'media_generaliste',
  'sky sport italia': 'media_generaliste',
  'sky sport de': 'media_generaliste',
  'the athletic': 'media_generaliste',
  "l'equipe": 'media_generaliste',
  "l'équipe": 'media_generaliste',
  'rmc sport': 'media_generaliste',
  marca: 'media_generaliste',
  as: 'media_generaliste',
  'gazzetta dello sport': 'media_generaliste',
  kicker: 'media_generaliste',
  bbc: 'media_generaliste',
  'bbc sport': 'media_generaliste',
  espn: 'media_generaliste',
};

function normaliser(nom: string): string {
  return nom.trim().toLowerCase();
}

export function categoriserSource(nom: string): SourceCategorie {
  return CATALOGUE_SOURCES[normaliser(nom)] ?? 'non_verifie';
}
