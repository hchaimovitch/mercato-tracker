export type WindowId = 'e26' | 'h26' | 'e25';
export type LeagueId = 'pl' | 'l1' | 'bl' | 'sa' | 'll';
export type Statut = 'rumeur' | 'contact_confirme' | 'negociation' | 'accord_clubs' | 'accord_joueur' | 'officiel' | 'annule';
export type SourceCategorie = 'club_officiel' | 'journaliste_reconnu' | 'media_generaliste' | 'non_verifie';
export type DetailStepState = 'confirme' | 'non_documente' | 'actuel' | 'a_venir';

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
  id: number;
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
  joueur: string;
  meta: string | null;
  updated: string;
  breaking: boolean;
  league: { id: LeagueId; name: string; color: string };
  from: ClubRef;
  to: ClubRef;
  fee: string | null;
  scoreFiabilite: number | null;
  statut: Statut;
  statutLabel: string;
  step: number | null;
  tier: Tier;
  progressColor: string;
  segs: Segment[];
}

export interface DetailStep {
  label: string;
  state: DetailStepState;
  date: string | null;
}

export interface SourceCitation {
  sourceId: number;
  nom: string;
  categorie: SourceCategorie;
  categorieLabel: string;
  categorieGlyph: string;
  categorieColor: string;
  reliabilitePct: number | null;
  n: number;
  primaire: boolean;
  date: string;
  lienSource: string | null;
  origine: string;
}

export interface TransferDetail extends TransferCard {
  type: string;
  fromLeagueName: string;
  toLeagueName: string;
  annule: boolean;
  detailSteps: DetailStep[];
  sources: {
    primaire: SourceCitation | null;
    relais: SourceCitation[];
    hasRelais: boolean;
    corrobCount: number;
    corrobLabel: string;
    srcSegs: Segment[];
  };
  timeline: SourceCitation[];
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
  id: number;
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
  transfertId: number;
  joueur: string;
  autreNom: string;
  autreAbbr: string;
  autreCouleur: string;
  fee: string | null;
  tier: Tier;
}

export interface ClubView {
  id: number;
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
  nom: string;
  categorie: SourceCategorie;
  categorieLabel: string;
  categorieGlyph: string;
  categorieColor: string;
  categorieDescription: string;
  reliabilitePct: number | null;
  n: number;
  trackedLabel: string;
}
