import { getSourceById } from '../repo/sources.repo.js';
import { CATEGORIE_META } from './categorieMeta.js';
import { sourceReliability } from './wilson.js';

export interface SourceProfileDTO {
  nom: string;
  categorie: string;
  categorieLabel: string;
  categorieGlyph: string;
  categorieColor: string;
  categorieDescription: string;
  reliabilitePct: number | null;
  n: number;
  trackedLabel: string;
}

export async function sourceProfileView(sourceId: number): Promise<SourceProfileDTO | undefined> {
  const source = await getSourceById(sourceId);
  if (!source) return undefined;
  const rel = sourceReliability(source.rumeurs_confirmees, source.rumeurs_infirmees);
  const meta = CATEGORIE_META[source.categorie];
  return {
    nom: source.nom,
    categorie: source.categorie,
    categorieLabel: meta.label,
    categorieGlyph: meta.glyph,
    categorieColor: meta.color,
    categorieDescription: meta.description,
    reliabilitePct: rel.score !== null ? Math.round(rel.score * 100) : null,
    n: rel.n,
    trackedLabel: rel.n > 0 ? `Sur ${rel.n} rumeurs suivies (${source.rumeurs_confirmees} confirmées, ${source.rumeurs_infirmees} infirmées)` : 'Historique insuffisant — aucune rumeur de cette source encore résolue',
  };
}
