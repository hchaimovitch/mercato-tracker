export interface Tier {
  color: string;
  glyph: string;
  label: string;
  badgeBg: string;
  badgeBorder: string;
}

/**
 * Signal à 3 niveaux, toujours accompagné d'un glyphe (nombre de points) et
 * d'un label texte — jamais la couleur seule. Basé sur le score de fiabilité
 * réel du transfert (0-100), pas sur son étape de statut.
 */
export function tierFromScore(score: number | null): Tier {
  if (score === null) {
    return { color: '#98a2b3', glyph: '●○○', label: 'Indéterminé', badgeBg: 'rgba(152,162,179,0.12)', badgeBorder: 'rgba(152,162,179,0.40)' };
  }
  if (score >= 70) {
    return { color: '#4cc38a', glyph: '●●●', label: score >= 100 ? 'Officiel' : 'Fort', badgeBg: 'rgba(76,195,138,0.10)', badgeBorder: 'rgba(76,195,138,0.40)' };
  }
  if (score >= 40) {
    return { color: '#f5b301', glyph: '●●○', label: 'Modéré', badgeBg: 'rgba(245,179,1,0.10)', badgeBorder: 'rgba(245,179,1,0.40)' };
  }
  return { color: '#98a2b3', glyph: '●○○', label: 'Faible', badgeBg: 'rgba(152,162,179,0.12)', badgeBorder: 'rgba(152,162,179,0.40)' };
}

export function progressColor(statut: string): string {
  return statut === 'officiel' ? '#4cc38a' : '#f5b301';
}
