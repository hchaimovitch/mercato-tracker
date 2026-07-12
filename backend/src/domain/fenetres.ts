import type { FenetreRow } from '../types.js';

export interface FenetreView {
  id: string;
  label: string;
  sub: string;
  full: string;
  live: boolean;
}

/** en_cours est recalculé à la lecture (pas stocké) pour ne jamais devenir périmé. */
export function toFenetreView(row: FenetreRow, today = new Date()): FenetreView {
  const iso = today.toISOString().slice(0, 10);
  const live = row.date_debut <= iso && iso <= row.date_fin;
  return {
    id: row.id,
    label: row.label,
    sub: live ? 'en cours' : 'clôturé',
    full: row.nom_complet,
    live,
  };
}
