import { LEAGUE_MEDIA, LEAK_SOURCE_NAME, SOURCE_CATALOG, TYPE_DESCRIPTIONS, TYPE_META } from '../data/seed.js';
import type { RawTransfer, SourceMeta, SourceType } from '../types.js';

export interface SourceEntry {
  name: string;
  primary: boolean;
  time: string;
  official: boolean;
  type: SourceType;
  reliability: number;
  tracked: number | null;
  typeLabel: string;
  typeGlyph: string;
  typeColor: string;
}

interface RawSourceMention {
  name: string;
  primary: boolean;
  time: string;
  official?: boolean;
}

function metaFor(name: string, official: boolean): SourceMeta {
  if (official) return { type: 'officiel', reliability: 100, tracked: null };
  return SOURCE_CATALOG[name] || { type: 'media', reliability: 70, tracked: 80 };
}

function enrichSource(s: RawSourceMention): SourceEntry {
  const meta = metaFor(s.name, !!s.official);
  const tm = TYPE_META[meta.type];
  return {
    name: s.name, primary: s.primary, time: s.time, official: !!s.official,
    type: meta.type, reliability: meta.reliability, tracked: meta.tracked,
    typeLabel: tm.label, typeGlyph: tm.glyph, typeColor: tm.color,
  };
}

/** Deterministic per-transfer source list: a primary breaker, corroborating relays, and an official confirmation once step 6 is reached. */
export function sourcesFor(t: RawTransfer): SourceEntry[] {
  const media = LEAGUE_MEDIA[t.league] || ['Sky Sports', 'The Athletic'];
  const lowSignal = t.step <= 2;
  const usesLeak = lowSignal && t.id % 3 === 0;
  const primaryName = usesLeak ? LEAK_SOURCE_NAME : 'Fabrizio Romano';
  const count = t.step <= 1 ? 1 : t.step <= 2 ? 2 : 3;
  const times = ['il y a 6j', 'il y a 4j', 'il y a 2j', 'il y a 1j'];

  const list: RawSourceMention[] = [{ name: primaryName, primary: true, time: times[0] }];
  const relayCandidates = ['Fabrizio Romano', ...media].filter((n) => n !== primaryName);
  let ri = 0;
  while (list.length < count && ri < relayCandidates.length) {
    list.push({ name: relayCandidates[ri], primary: false, time: times[list.length] || 'il y a 1j' });
    ri++;
  }
  if (t.step >= 6) {
    list.push({ name: `${t.to.name} (officiel)`, primary: false, time: t.updated, official: true });
  }
  return list.map(enrichSource);
}

export interface SourceProfile {
  name: string;
  reliability: number;
  trackedLabel: string;
  typeLabel: string;
  typeGlyph: string;
  typeColor: string;
  typeDesc: string;
}

export function sourceProfile(name: string, isOfficial: boolean): SourceProfile {
  const meta = metaFor(name, isOfficial);
  const tm = TYPE_META[meta.type];
  return {
    name,
    reliability: meta.reliability,
    trackedLabel: meta.tracked ? `Sur ${meta.tracked} rumeurs suivies` : 'Communication officielle du club',
    typeLabel: tm.label,
    typeGlyph: tm.glyph,
    typeColor: tm.color,
    typeDesc: TYPE_DESCRIPTIONS[meta.type],
  };
}
