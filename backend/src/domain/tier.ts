import type { Step } from '../types.js';

export const STEPS = ['Rumeur', 'Contact confirmé', 'Négociation', 'Accord clubs', 'Accord joueur', 'Officiel'];

export interface Tier {
  color: string;
  glyph: string;
  label: string;
  badgeBg: string;
  badgeBorder: string;
}

/** 3-level signal, always paired with a glyph (dot count) and a text label — never color alone. */
export function tier(step: Step): Tier {
  if (step >= 5) {
    return {
      color: '#4cc38a', glyph: '●●●', label: step >= 6 ? 'Officiel' : 'Fort',
      badgeBg: 'rgba(76,195,138,0.10)', badgeBorder: 'rgba(76,195,138,0.40)',
    };
  }
  if (step >= 3) {
    return { color: '#f5b301', glyph: '●●○', label: 'Modéré', badgeBg: 'rgba(245,179,1,0.10)', badgeBorder: 'rgba(245,179,1,0.40)' };
  }
  return { color: '#98a2b3', glyph: '●○○', label: 'Faible', badgeBg: 'rgba(152,162,179,0.12)', badgeBorder: 'rgba(152,162,179,0.40)' };
}

export function progressSegments(step: Step): { on: boolean }[] {
  return Array.from({ length: 6 }, (_, i) => ({ on: i < step }));
}

export function progressColor(step: Step): string {
  return step >= 6 ? '#4cc38a' : '#f5b301';
}
