import { CLUBS, LEAGUES } from '../data/seed.js';
import { fmtMoney, fmtNet, parseFee } from './money.js';
import { itemsForWindow, toCard } from './transfers.js';
import type { LeagueId, WindowId } from '../types.js';

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

export function leaguesOverview(window: WindowId): LeaguesOverview {
  const items = itemsForWindow(window);
  const rows = LEAGUES.map((l) => ({ l, items: items.filter((t) => t.league === l.id) }));
  const maxCount = Math.max(1, ...rows.map((r) => r.items.length));
  const overviewRows = rows.map((r) => {
    const total = r.items.reduce((s, t) => s + parseFee(t.fee), 0);
    return {
      id: r.l.id, name: r.l.name, short: r.l.short, color: r.l.color,
      count: r.items.length, totalStr: fmtMoney(total),
      barPct: Math.round((r.items.length / maxCount) * 100),
    };
  });
  return {
    rows: overviewRows,
    totalCount: items.length,
    totalMoneyStr: fmtMoney(items.reduce((s, t) => s + parseFee(t.fee), 0)),
  };
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

export function leagueClubs(leagueId: LeagueId, window: WindowId): ClubActivityRow[] {
  const items = itemsForWindow(window);
  const rows: ClubActivityRow[] = [];
  Object.keys(CLUBS).forEach((abbr) => {
    const club = CLUBS[abbr];
    if (club.league !== leagueId) return;
    const arrivals = items.filter((t) => t.to.abbr === abbr);
    const departures = items.filter((t) => t.from.abbr === abbr);
    if (arrivals.length + departures.length === 0) return;
    const moneyIn = arrivals.reduce((s, t) => s + parseFee(t.fee), 0);
    const moneyOut = departures.reduce((s, t) => s + parseFee(t.fee), 0);
    const net = moneyOut - moneyIn;
    rows.push({
      abbr, name: club.name, color: club.color,
      arr: arrivals.length, dep: departures.length,
      netStr: fmtNet(net), netColor: net >= 0 ? '#4cc38a' : '#e08a6f',
    });
  });
  rows.sort((a, b) => b.arr + b.dep - (a.arr + a.dep));
  return rows;
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

export function leagueView(leagueId: LeagueId, window: WindowId): LeagueView {
  const lg = LEAGUES.find((l) => l.id === leagueId) ?? LEAGUES[0];
  const clubs = leagueClubs(leagueId, window);
  const items = itemsForWindow(window).filter((t) => t.league === leagueId);
  const volume = items.reduce((s, t) => s + parseFee(t.fee), 0);
  return {
    id: lg.id, name: lg.name, short: lg.short, color: lg.color,
    clubs, clubCount: clubs.length,
    arrTotal: clubs.reduce((s, c) => s + c.arr, 0),
    depTotal: clubs.reduce((s, c) => s + c.dep, 0),
    volume: fmtMoney(volume),
  };
}

export interface ClubMovement {
  transferId: number;
  player: string;
  posShort: string;
  otherName: string;
  otherAbbr: string;
  otherColor: string;
  fee: string;
  tier: ReturnType<typeof import('./tier.js').tier>;
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

export function clubView(abbr: string, window: WindowId): ClubView {
  const club = CLUBS[abbr] ?? { abbr, name: abbr, league: 'pl' as LeagueId, color: '#555555' };
  const lg = LEAGUES.find((l) => l.id === club.league) ?? LEAGUES[0];
  const items = itemsForWindow(window);

  const arrivalItems = items.filter((t) => t.to.abbr === abbr);
  const departureItems = items.filter((t) => t.from.abbr === abbr);

  const toMovement = (t: (typeof items)[number], dir: 'in' | 'out'): ClubMovement => {
    const other = dir === 'in' ? t.from : t.to;
    const card = toCard(t);
    return {
      transferId: t.id, player: t.player, posShort: t.posShort,
      otherName: other.name, otherAbbr: other.abbr, otherColor: other.color,
      fee: t.fee, tier: card.tier,
    };
  };

  const arrivals = arrivalItems.map((t) => toMovement(t, 'in'));
  const departures = departureItems.map((t) => toMovement(t, 'out'));

  const moneyIn = arrivalItems.reduce((s, t) => s + parseFee(t.fee), 0);
  const moneyOut = departureItems.reduce((s, t) => s + parseFee(t.fee), 0);
  const net = moneyOut - moneyIn;

  return {
    abbr, name: club.name, color: club.color, leagueName: lg.name,
    inStr: fmtMoney(moneyIn), outStr: fmtMoney(moneyOut),
    netStr: fmtNet(net), netColor: net >= 0 ? '#4cc38a' : '#e08a6f',
    arrivals, departures,
    arrCount: arrivals.length, depCount: departures.length,
    hasArr: arrivals.length > 0, hasDep: departures.length > 0,
    noArr: arrivals.length === 0, noDep: departures.length === 0,
  };
}
