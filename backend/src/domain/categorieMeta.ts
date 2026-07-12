import type { SourceCategorie } from '../types.js';

export const CATEGORIE_META: Record<SourceCategorie, { label: string; glyph: string; color: string; description: string }> = {
  club_officiel: {
    label: 'Club officiel',
    glyph: '◆',
    color: '#4cc38a',
    description: 'Confirmation officielle (API-Football) — fiabilité maximale par définition.',
  },
  journaliste_reconnu: {
    label: 'Journaliste spécialisé',
    glyph: '✎',
    color: '#f5b301',
    description: 'Journaliste spécialisé transferts figurant dans notre catalogue curaté de sources reconnues.',
  },
  media_generaliste: {
    label: 'Média généraliste',
    glyph: '▤',
    color: '#6fa8e0',
    description: 'Média sportif généraliste relayant ou confirmant une information.',
  },
  non_verifie: {
    label: 'Non vérifié',
    glyph: '?',
    color: '#98a2b3',
    description: "Source non répertoriée dans notre catalogue — traité avec prudence par défaut, pas par supposition de mauvaise foi.",
  },
};
