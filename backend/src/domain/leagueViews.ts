import { listClubsByLeague } from '../repo/clubs.repo.js';
import { listLeagues } from '../repo/leagues.repo.js';
import { arriveesPourClub, departsPourClub, listerParFenetre } from '../repo/transferts.repo.js';
import { getClub } from '../repo/clubs.repo.js';
import { getLeague } from '../repo/leagues.repo.js';
import type { LeagueId } from '../types.js';
import { fmtMoney, fmtNet, parseFee } from './money.js';
import { toCard } from './views.js';

export interface LeagueOverviewRowDTO {
  id: LeagueId;
  name: string;
  short: string;
  color: string;
  count: number;
  totalStr: string;
  barPct: number;
}

export interface LeaguesOverviewDTO {
  rows: LeagueOverviewRowDTO[];
  totalCount: number;
  totalMoneyStr: string;
}

export function leaguesOverview(fenetreId: string): LeaguesOverviewDTO {
  const leagues = listLeagues();
  const parLigue = leagues.map((l) => ({ l, items: listerParFenetre(fenetreId, l.id) }));
  const maxCount = Math.max(1, ...parLigue.map((r) => r.items.length));

  const rows = parLigue.map((r) => {
    const total = r.items.reduce((s, t) => s + parseFee(t.montant ?? ''), 0);
    return {
      id: r.l.id, name: r.l.nom, short: r.l.code_court, color: r.l.couleur,
      count: r.items.length, totalStr: fmtMoney(total),
      barPct: Math.round((r.items.length / maxCount) * 100),
    };
  });

  const tousLesItems = parLigue.flatMap((r) => r.items);
  return {
    rows,
    totalCount: tousLesItems.length,
    totalMoneyStr: fmtMoney(tousLesItems.reduce((s, t) => s + parseFee(t.montant ?? ''), 0)),
  };
}

export interface ClubActivityRowDTO {
  id: number;
  abbr: string;
  name: string;
  color: string;
  arr: number;
  dep: number;
  netStr: string;
  netColor: string;
}

export interface LeagueViewDTO {
  id: LeagueId;
  name: string;
  short: string;
  color: string;
  clubCount: number;
  arrTotal: number;
  depTotal: number;
  volume: string;
  clubs: ClubActivityRowDTO[];
}

export function leagueView(leagueId: LeagueId, fenetreId: string): LeagueViewDTO {
  const league = getLeague(leagueId)!;
  const clubs = listClubsByLeague(leagueId);

  const rows = clubs
    .map((c) => {
      const arrivals = arriveesPourClub(c.id, fenetreId);
      const departures = departsPourClub(c.id, fenetreId);
      if (arrivals.length + departures.length === 0) return null;
      const moneyIn = arrivals.reduce((s, t) => s + parseFee(t.montant ?? ''), 0);
      const moneyOut = departures.reduce((s, t) => s + parseFee(t.montant ?? ''), 0);
      const net = moneyOut - moneyIn;
      return {
        id: c.id, abbr: c.abbr, name: c.nom, color: c.couleur,
        arr: arrivals.length, dep: departures.length,
        netStr: fmtNet(net), netColor: net >= 0 ? '#4cc38a' : '#e08a6f',
      };
    })
    .filter((r): r is ClubActivityRowDTO => r !== null)
    .sort((a, b) => b.arr + b.dep - (a.arr + a.dep));

  const items = listerParFenetre(fenetreId, leagueId);
  const volume = items.reduce((s, t) => s + parseFee(t.montant ?? ''), 0);

  return {
    id: league.id, name: league.nom, short: league.code_court, color: league.couleur,
    clubs: rows, clubCount: rows.length,
    arrTotal: rows.reduce((s, c) => s + c.arr, 0),
    depTotal: rows.reduce((s, c) => s + c.dep, 0),
    volume: fmtMoney(volume),
  };
}

export interface ClubMovementDTO {
  transfertId: number;
  joueur: string;
  autreNom: string;
  autreAbbr: string;
  autreCouleur: string;
  fee: string | null;
  tier: ReturnType<typeof toCard>['tier'];
}

export interface ClubViewDTO {
  id: number;
  abbr: string;
  name: string;
  color: string;
  leagueName: string;
  inStr: string;
  outStr: string;
  netStr: string;
  netColor: string;
  arrivals: ClubMovementDTO[];
  departures: ClubMovementDTO[];
  arrCount: number;
  depCount: number;
  hasArr: boolean;
  hasDep: boolean;
  noArr: boolean;
  noDep: boolean;
}

export function clubView(clubId: number, fenetreId: string): ClubViewDTO | undefined {
  const club = getClub(clubId);
  if (!club) return undefined;
  const league = getLeague(club.championnat_id as LeagueId);

  const arrivalItems = arriveesPourClub(clubId, fenetreId);
  const departureItems = departsPourClub(clubId, fenetreId);

  const toMovement = (t: (typeof arrivalItems)[number], dir: 'in' | 'out'): ClubMovementDTO => {
    const autreId = dir === 'in' ? t.club_sortant_id : t.club_entrant_id;
    const autre = autreId ? getClub(autreId) : undefined;
    const card = toCard(t);
    return {
      transfertId: t.id, joueur: t.joueur,
      autreNom: autre?.nom ?? 'Inconnu', autreAbbr: autre?.abbr ?? '?', autreCouleur: autre?.couleur ?? '#555',
      fee: t.montant, tier: card.tier,
    };
  };

  const arrivals = arrivalItems.map((t) => toMovement(t, 'in'));
  const departures = departureItems.map((t) => toMovement(t, 'out'));
  const moneyIn = arrivalItems.reduce((s, t) => s + parseFee(t.montant ?? ''), 0);
  const moneyOut = departureItems.reduce((s, t) => s + parseFee(t.montant ?? ''), 0);
  const net = moneyOut - moneyIn;

  return {
    id: club.id, abbr: club.abbr, name: club.nom, color: club.couleur,
    leagueName: league?.nom ?? '—',
    inStr: fmtMoney(moneyIn), outStr: fmtMoney(moneyOut),
    netStr: fmtNet(net), netColor: net >= 0 ? '#4cc38a' : '#e08a6f',
    arrivals, departures,
    arrCount: arrivals.length, depCount: departures.length,
    hasArr: arrivals.length > 0, hasDep: departures.length > 0,
    noArr: arrivals.length === 0, noDep: departures.length === 0,
  };
}
