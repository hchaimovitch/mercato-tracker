// z pour un intervalle de confiance à 95% (loi normale centrée réduite, bilatérale).
const Z95 = 1.959963984540054;

export interface SourceReliability {
  confirmees: number;
  infirmees: number;
  n: number;
  /** Borne basse de Wilson (0..1), null si aucun échantillon (n=0) — pas de score inventé. */
  score: number | null;
}

/**
 * Borne basse de l'intervalle de confiance à 95% (score de Wilson).
 * Volontairement conservatrice sur petit échantillon (ex: 1 confirmée / 1 essai
 * donne ~0.21, pas 1.0) — c'est le mécanisme même qui évite qu'une source neuve
 * paraisse plus fiable qu'elle ne l'est, sans seuil arbitraire à part n=0.
 */
export function wilsonLowerBound(confirmees: number, infirmees: number): number | null {
  const n = confirmees + infirmees;
  if (n === 0) return null;
  const p = confirmees / n;
  const z2 = Z95 * Z95;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const marge = Z95 * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return Math.max(0, (centre - marge) / denom);
}

export function sourceReliability(confirmees: number, infirmees: number): SourceReliability {
  return { confirmees, infirmees, n: confirmees + infirmees, score: wilsonLowerBound(confirmees, infirmees) };
}
