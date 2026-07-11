export type WindowId = 'e26' | 'h26' | 'e25';
export type LeagueId = 'pl' | 'l1' | 'bl' | 'sa' | 'll';
export type SourceType = 'officiel' | 'journaliste' | 'media' | 'non_verifie';
export type Step = 1 | 2 | 3 | 4 | 5 | 6;

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

export interface Club {
  abbr: string;
  name: string;
  league: LeagueId;
  color: string;
}

export interface SourceMeta {
  type: SourceType;
  reliability: number;
  tracked: number | null;
}

export interface ClubRef {
  name: string;
  abbr: string;
  color: string;
}

export interface RawTransfer {
  id: number;
  window: WindowId;
  player: string;
  posAge: string;
  posShort: string;
  meta: string;
  league: LeagueId;
  from: ClubRef;
  to: ClubRef;
  fee: string;
  step: Step;
  reliability: number;
  updated: string;
  breaking: boolean;
  type: string;
  typeShort: string;
  contract: string;
  mv: string;
  wage: string;
  contractLen: string;
  contractUntil: string;
  fromLeague: string;
  fromRank: string;
  toRank: string;
  posGroup: string;
}
