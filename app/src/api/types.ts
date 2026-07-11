export type WindowId = 'e26' | 'h26' | 'e25';
export type LeagueId = 'pl' | 'l1' | 'bl' | 'sa' | 'll';
export type SourceType = 'officiel' | 'journaliste' | 'media' | 'non_verifie';
export type StepState = 'done' | 'current' | 'todo';

export interface Window {
  id: WindowId;
  label: string;
  sub: string;
  full: string;
  live: boolean;
}

export interface League {
  id: LeagueId;
  name: string;
  short: string;
  color: string;
}

export interface ClubRef {
  name: string;
  abbr: string;
  color: string;
}

export interface Tier {
  color: string;
  glyph: string;
  label: string;
  badgeBg: string;
  badgeBorder: string;
}

export interface Segment {
  on: boolean;
}

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
  step: number;
  stepLabel: string;
  tier: Tier;
  progressColor: string;
  segs: Segment[];
}

export interface FaceLine {
  done: boolean;
  text: string;
}

export interface DetailStep {
  label: string;
  state: StepState;
  stateText: string;
  hasLine: boolean;
}

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
    primary: SourceEntry;
    relays: SourceEntry[];
    hasRelays: boolean;
    corrobCount: number;
    corrobLabel: string;
    srcSegs: Segment[];
  };
  timeline: SourceEntry[];
}

export interface LeagueOverviewRow {
  id: LeagueId;
  name: string;
  short: string;
  color: string;
  count: number;
  totalStr: string;
  barPct: number;
}

export interface LeaguesOverview {
  rows: LeagueOverviewRow[];
  totalCount: number;
  totalMoneyStr: string;
}

export interface ClubActivityRow {
  abbr: string;
  name: string;
  color: string;
  arr: number;
  dep: number;
  netStr: string;
  netColor: string;
}

export interface LeagueView {
  id: LeagueId;
  name: string;
  short: string;
  color: string;
  clubCount: number;
  arrTotal: number;
  depTotal: number;
  volume: string;
  clubs: ClubActivityRow[];
}

export interface ClubMovement {
  transferId: number;
  player: string;
  posShort: string;
  otherName: string;
  otherAbbr: string;
  otherColor: string;
  fee: string;
  tier: Tier;
}

export interface ClubView {
  abbr: string;
  name: string;
  color: string;
  leagueName: string;
  inStr: string;
  outStr: string;
  netStr: string;
  netColor: string;
  arrivals: ClubMovement[];
  departures: ClubMovement[];
  arrCount: number;
  depCount: number;
  hasArr: boolean;
  hasDep: boolean;
  noArr: boolean;
  noDep: boolean;
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
