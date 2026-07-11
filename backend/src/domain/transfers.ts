import { LEAGUES, RAW_TRANSFERS } from '../data/seed.js';
import { parseFee } from './money.js';
import { sourcesFor } from './sources.js';
import { progressColor, progressSegments, STEPS, tier, type Tier } from './tier.js';
import type { ClubRef, LeagueId, RawTransfer, Step, WindowId } from '../types.js';

export interface TransferCard {
  id: number;
  player: string;
  meta: string;
  updated: string;
  breaking: boolean;
  league: { id: LeagueId; name: string; color: string };
  from: ClubRef;
  to: ClubRef;
  fee: string;
  reliability: number;
  step: Step;
  stepLabel: string;
  tier: Tier;
  progressColor: string;
  segs: { on: boolean }[];
}

function leagueMeta(id: LeagueId) {
  return LEAGUES.find((l) => l.id === id) ?? LEAGUES[0];
}

export function toCard(t: RawTransfer): TransferCard {
  const lg = leagueMeta(t.league);
  return {
    id: t.id, player: t.player, meta: t.meta, updated: t.updated, breaking: t.breaking,
    league: { id: lg.id, name: lg.name, color: lg.color },
    from: t.from, to: t.to, fee: t.fee, reliability: t.reliability, step: t.step,
    stepLabel: STEPS[t.step - 1], tier: tier(t.step),
    progressColor: progressColor(t.step), segs: progressSegments(t.step),
  };
}

function sortKey(t: RawTransfer): number {
  return (t.breaking ? 2 : 0) + (parseFee(t.fee) >= 60 ? 1 : 0);
}

/** Stable sort: à la une first, then ≥€60M operations, ties keep original order. */
export function sortFeed(items: RawTransfer[]): RawTransfer[] {
  return [...items].sort((a, b) => sortKey(b) - sortKey(a));
}

export function itemsForWindow(window: WindowId): RawTransfer[] {
  return RAW_TRANSFERS.filter((t) => t.window === window);
}

export function getFeed(window: WindowId, leagueId?: LeagueId): TransferCard[] {
  const items = itemsForWindow(window).filter((t) => !leagueId || t.league === leagueId);
  return sortFeed(items).map(toCard);
}

export function findTransfer(id: number): RawTransfer | undefined {
  return RAW_TRANSFERS.find((t) => t.id === id);
}

/** Cards for a set of ids (any window), in the order requested — used by the local "Suivis" list. */
export function cardsByIds(ids: number[]): TransferCard[] {
  return ids
    .map((id) => RAW_TRANSFERS.find((t) => t.id === id))
    .filter((t): t is RawTransfer => !!t)
    .map(toCard);
}

interface FaceLine {
  done: boolean;
  text: string;
}

function faceLines(t: RawTransfer) {
  const strong = t.step >= 3;
  const offered = t.step >= 2;
  const official = t.step >= 6;

  const sortantLines: FaceLine[] = [
    { done: strong || official, text: official ? 'Vente actée' : strong ? 'Ouvert à la vente' : "À l'écoute d'offres" },
    { done: false, text: `Sous contrat ${t.contractUntil}` },
    { done: false, text: `Valeur ${t.mv}` },
  ];
  const entrantLines: FaceLine[] = [
    { done: offered, text: `Priorité ${t.posGroup}` },
    { done: offered, text: official ? `Achat finalisé · ${t.fee}` : offered ? `Offre ${t.fee} soumise` : 'Intérêt exploratoire' },
    { done: false, text: `Salaire ${t.wage}` },
  ];
  return { sortantLines, entrantLines };
}

export type StepState = 'done' | 'current' | 'todo';

export interface DetailStep {
  label: string;
  state: StepState;
  stateText: string;
  hasLine: boolean;
}

export function detailStepsData(step: Step): DetailStep[] {
  return STEPS.map((label, i) => {
    const state: StepState = i < step - 1 ? 'done' : i === step - 1 ? 'current' : 'todo';
    return {
      label, state,
      stateText: state === 'done' ? 'Étape validée' : state === 'current' ? 'En cours' : 'À venir',
      hasLine: i < STEPS.length - 1,
    };
  });
}

export interface TransferDetail extends TransferCard {
  mv: string;
  type: string;
  contractLen: string;
  wage: string;
  from: ClubRef & { leagueName: string; rank: string };
  to: ClubRef & { leagueName: string; rank: string };
  sortantLines: FaceLine[];
  entrantLines: FaceLine[];
  detailSteps: DetailStep[];
  sources: {
    primary: ReturnType<typeof sourcesFor>[number];
    relays: ReturnType<typeof sourcesFor>[number][];
    hasRelays: boolean;
    corrobCount: number;
    corrobLabel: string;
    srcSegs: { on: boolean }[];
  };
  timeline: ReturnType<typeof sourcesFor>;
}

export function buildDetail(t: RawTransfer): TransferDetail {
  const card = toCard(t);
  const lg = leagueMeta(t.league);
  const { sortantLines, entrantLines } = faceLines(t);

  const timeline = sourcesFor(t);
  const primary = timeline.find((s) => s.primary) ?? timeline[0];
  const relays = timeline.filter((s) => !s.primary);
  const corrobCount = timeline.length;
  const corrobLabel = corrobCount <= 1 ? 'Source unique — non corroborée' : `Confirmé par ${corrobCount} sources indépendantes`;
  const srcSegs = Array.from({ length: 5 }, (_, i) => ({ on: i < Math.min(corrobCount, 5) }));

  return {
    ...card,
    mv: t.mv, type: t.type, contractLen: t.contractLen, wage: t.wage,
    from: { ...t.from, leagueName: t.fromLeague, rank: t.fromRank },
    to: { ...t.to, leagueName: lg.name, rank: t.toRank },
    sortantLines, entrantLines,
    detailSteps: detailStepsData(t.step),
    sources: { primary, relays, hasRelays: relays.length > 0, corrobCount, corrobLabel, srcSegs },
    timeline,
  };
}
