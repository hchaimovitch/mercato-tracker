import type { Club, League, RawTransfer, SourceMeta, SourceType, Window } from '../types.js';

export const WINDOWS: Window[] = [
  { id: 'e26', label: 'Été 26', sub: 'en cours', full: 'Été 2026', live: true },
  { id: 'h26', label: 'Hiver 26', sub: 'clôturé', full: 'Hiver 2026', live: false },
  { id: 'e25', label: 'Été 25', sub: 'clôturé', full: 'Été 2025', live: false },
];

export const LEAGUES: League[] = [
  { id: 'pl', name: 'Premier League', short: 'PL', color: '#9b8cf0' },
  { id: 'l1', name: 'Ligue 1', short: 'L1', color: '#6fa8e0' },
  { id: 'bl', name: 'Bundesliga', short: 'BL', color: '#e0776f' },
  { id: 'sa', name: 'Serie A', short: 'SA', color: '#6fc59a' },
  { id: 'll', name: 'La Liga', short: 'LL', color: '#e0a86f' },
];

export const CLUBS: Record<string, Club> = {
  MCR: { abbr: 'MCR', name: 'Manchester', league: 'pl', color: '#b0392b' },
  NEW: { abbr: 'NEW', name: 'Newcastle', league: 'pl', color: '#3a4550' },
  LDN: { abbr: 'LDN', name: 'London City', league: 'pl', color: '#6a8ac0' },
  SEA: { abbr: 'SEA', name: 'Seaside', league: 'pl', color: '#2f8a9a' },
  PSG: { abbr: 'PSG', name: 'Paris SG', league: 'l1', color: '#2a3a6a' },
  OM: { abbr: 'OM', name: 'Marseille', league: 'l1', color: '#2f7fb0' },
  OL: { abbr: 'OL', name: 'Lyon', league: 'l1', color: '#4a6a8a' },
  MON: { abbr: 'MON', name: 'Monaco', league: 'l1', color: '#b03535' },
  REN: { abbr: 'REN', name: 'Rennes', league: 'l1', color: '#8a3a3a' },
  DOR: { abbr: 'DOR', name: 'Dortmund', league: 'bl', color: '#c9a227' },
  MUN: { abbr: 'MUN', name: 'München', league: 'bl', color: '#a03030' },
  LEI: { abbr: 'LEI', name: 'Leipzig', league: 'bl', color: '#c04a4a' },
  MIL: { abbr: 'MIL', name: 'Milan', league: 'sa', color: '#a0402f' },
  ROM: { abbr: 'ROM', name: 'Roma', league: 'sa', color: '#8a4a4a' },
  JUV: { abbr: 'JUV', name: 'Juventus', league: 'sa', color: '#4d4d4d' },
  NAP: { abbr: 'NAP', name: 'Napoli', league: 'sa', color: '#2f7fb0' },
  ATM: { abbr: 'ATM', name: 'Atlético', league: 'll', color: '#8a3535' },
  BET: { abbr: 'BET', name: 'Betis', league: 'll', color: '#3a6a4a' },
  SEV: { abbr: 'SEV', name: 'Sevilla', league: 'll', color: '#b03030' },
};

export const TYPE_META: Record<SourceType, { label: string; glyph: string; color: string }> = {
  officiel: { label: 'Club officiel', glyph: '◆', color: '#4cc38a' },
  journaliste: { label: 'Journaliste spécialisé', glyph: '✎', color: '#f5b301' },
  media: { label: 'Média généraliste', glyph: '▤', color: '#6fa8e0' },
  non_verifie: { label: 'Non vérifié', glyph: '?', color: '#98a2b3' },
};

export const TYPE_DESCRIPTIONS: Record<SourceType, string> = {
  officiel: "Annonce publiée directement par le club — fiabilité maximale par définition.",
  journaliste: 'Journaliste spécialisé transferts, réseau de contacts direct chez les clubs et agents.',
  media: 'Média généraliste sportif, relaie ou confirme des informations déjà en circulation.',
  non_verifie: 'Compte non vérifié — à traiter avec prudence tant qu\'aucune source qualifiée ne confirme.',
};

export const SOURCE_CATALOG: Record<string, SourceMeta> = {
  'Fabrizio Romano': { type: 'journaliste', reliability: 91, tracked: 340 },
  'The Athletic': { type: 'journaliste', reliability: 86, tracked: 175 },
  'Sky Sports': { type: 'media', reliability: 84, tracked: 210 },
  "L'Équipe": { type: 'media', reliability: 88, tracked: 265 },
  'RMC Sport': { type: 'media', reliability: 79, tracked: 190 },
  Marca: { type: 'media', reliability: 75, tracked: 220 },
  AS: { type: 'media', reliability: 77, tracked: 150 },
  'Gazzetta dello Sport': { type: 'media', reliability: 80, tracked: 198 },
  'Sky Sport Italia': { type: 'media', reliability: 81, tracked: 160 },
  Kicker: { type: 'media', reliability: 85, tracked: 230 },
  'Sky Sport DE': { type: 'media', reliability: 82, tracked: 175 },
  'Compte Transfert_Leaks': { type: 'non_verifie', reliability: 38, tracked: 45 },
};

export const LEAK_SOURCE_NAME = 'Compte Transfert_Leaks';

export const LEAGUE_MEDIA: Record<string, string[]> = {
  pl: ['Sky Sports', 'The Athletic'],
  l1: ["L'Équipe", 'RMC Sport'],
  bl: ['Kicker', 'Sky Sport DE'],
  sa: ['Gazzetta dello Sport', 'Sky Sport Italia'],
  ll: ['Marca', 'AS'],
};

export const RAW_TRANSFERS: RawTransfer[] = [
  // ===== ÉTÉ 2026 (en cours) =====
  { id: 1, window: 'e26', player: 'Marcus Vessel', posAge: 'RW · 22', posShort: 'Ailier droit', meta: 'Ailier droit · 22 ans · BRA', league: 'pl',
    from: { name: 'Estádio FC', abbr: 'EST', color: '#4a5568' }, to: { name: 'Manchester', abbr: 'MCR', color: '#b0392b' },
    fee: '€82M', step: 5, reliability: 88, updated: 'il y a 2h', breaking: true, type: 'Transfert sec', typeShort: 'Sec', contract: '5 ans',
    mv: '€70M', wage: '€9M/an', contractLen: '5 ans · 2031', contractUntil: '2027', fromLeague: 'Liga Nos', fromRank: '4ᵉ', toRank: '2ᵉ', posGroup: 'offensive' },
  { id: 2, window: 'e26', player: 'Théo Lambert', posAge: 'CB · 24', posShort: 'Défenseur central', meta: 'Défenseur central · 24 ans · FRA', league: 'pl',
    from: { name: 'Lyon', abbr: 'OL', color: '#4a6a8a' }, to: { name: 'Newcastle', abbr: 'NEW', color: '#3a4550' },
    fee: '€45M', step: 4, reliability: 74, updated: 'il y a 5h', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '4 ans',
    mv: '€38M', wage: '€6M/an', contractLen: '4 ans · 2030', contractUntil: '2026', fromLeague: 'Ligue 1', fromRank: '3ᵉ', toRank: '5ᵉ', posGroup: 'défensive' },
  { id: 3, window: 'e26', player: 'Andrea Costa', posAge: 'AM · 27', posShort: 'Milieu offensif', meta: 'Milieu offensif · 27 ans · ITA', league: 'sa',
    from: { name: 'Roma', abbr: 'ROM', color: '#8a4a4a' }, to: { name: 'Milan', abbr: 'MIL', color: '#a0402f' },
    fee: '€30M', step: 3, reliability: 61, updated: 'il y a 8h', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '3 ans',
    mv: '€26M', wage: '€5M/an', contractLen: '3 ans · 2029', contractUntil: '2025', fromLeague: 'Serie A', fromRank: '5ᵉ', toRank: '3ᵉ', posGroup: 'créative' },
  { id: 4, window: 'e26', player: 'Lukas Berg', posAge: 'ST · 19', posShort: 'Avant-centre', meta: 'Avant-centre · 19 ans · GER', league: 'bl',
    from: { name: 'RB Salzburg', abbr: 'SAL', color: '#4a5a3a' }, to: { name: 'Dortmund', abbr: 'DOR', color: '#c9a227' },
    fee: '€55M', step: 6, reliability: 100, updated: 'il y a 1j', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '5 ans',
    mv: '€48M', wage: '€7M/an', contractLen: '5 ans · 2031', contractUntil: '2028', fromLeague: 'Bundesliga AT', fromRank: '2ᵉ', toRank: '1ᵉʳ', posGroup: 'offensive' },
  { id: 5, window: 'e26', player: 'Pablo Nieto', posAge: 'LB · 26', posShort: 'Latéral gauche', meta: 'Latéral gauche · 26 ans · ESP', league: 'll',
    from: { name: 'Betis', abbr: 'BET', color: '#3a6a4a' }, to: { name: 'Atlético', abbr: 'ATM', color: '#8a3535' },
    fee: '€22M', step: 2, reliability: 48, updated: 'il y a 1j', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '4 ans',
    mv: '€18M', wage: '€4M/an', contractLen: '4 ans · 2030', contractUntil: '2026', fromLeague: 'La Liga', fromRank: '6ᵉ', toRank: '3ᵉ', posGroup: 'défensive' },
  { id: 6, window: 'e26', player: 'Kylian Roux', posAge: 'DM · 23', posShort: 'Milieu défensif', meta: 'Milieu défensif · 23 ans · FRA', league: 'l1',
    from: { name: 'Rennes', abbr: 'REN', color: '#8a3a3a' }, to: { name: 'Paris SG', abbr: 'PSG', color: '#2a3a6a' },
    fee: '€38M', step: 1, reliability: 32, updated: 'il y a 2j', breaking: false, type: 'Rumeur', typeShort: 'Bruit', contract: '—',
    mv: '€30M', wage: '€8M/an', contractLen: 'À définir', contractUntil: '2027', fromLeague: 'Ligue 1', fromRank: '8ᵉ', toRank: '1ᵉʳ', posGroup: 'défensive' },
  { id: 7, window: 'e26', player: 'Diego Fuentes', posAge: 'CF · 25', posShort: 'Attaquant', meta: 'Attaquant · 25 ans · ARG', league: 'pl',
    from: { name: 'Marseille', abbr: 'OM', color: '#2f7fb0' }, to: { name: 'Manchester', abbr: 'MCR', color: '#b0392b' },
    fee: '€60M', step: 3, reliability: 58, updated: 'il y a 12h', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '4 ans',
    mv: '€52M', wage: '€8M/an', contractLen: '4 ans · 2030', contractUntil: '2027', fromLeague: 'Ligue 1', fromRank: '2ᵉ', toRank: '2ᵉ', posGroup: 'offensive' },
  { id: 8, window: 'e26', player: 'Sofiane Bakir', posAge: 'RW · 21', posShort: 'Ailier', meta: 'Ailier · 21 ans · MAR', league: 'l1',
    from: { name: 'Monaco', abbr: 'MON', color: '#b03535' }, to: { name: 'Paris SG', abbr: 'PSG', color: '#2a3a6a' },
    fee: '€48M', step: 5, reliability: 85, updated: 'il y a 3h', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '5 ans',
    mv: '€44M', wage: '€7M/an', contractLen: '5 ans · 2031', contractUntil: '2027', fromLeague: 'Ligue 1', fromRank: '5ᵉ', toRank: '1ᵉʳ', posGroup: 'offensive' },
  { id: 9, window: 'e26', player: 'Owen Blake', posAge: 'CM · 28', posShort: 'Milieu central', meta: 'Milieu central · 28 ans · ENG', league: 'pl',
    from: { name: 'Manchester', abbr: 'MCR', color: '#b0392b' }, to: { name: 'Newcastle', abbr: 'NEW', color: '#3a4550' },
    fee: '€28M', step: 4, reliability: 70, updated: 'il y a 1j', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '3 ans',
    mv: '€24M', wage: '€5M/an', contractLen: '3 ans · 2029', contractUntil: '2026', fromLeague: 'Premier League', fromRank: '2ᵉ', toRank: '5ᵉ', posGroup: 'créative' },
  { id: 10, window: 'e26', player: 'Tomás Reis', posAge: 'CB · 23', posShort: 'Défenseur central', meta: 'Défenseur central · 23 ans · POR', league: 'l1',
    from: { name: 'Porto', abbr: 'POR', color: '#3a5a8a' }, to: { name: 'Lyon', abbr: 'OL', color: '#4a6a8a' },
    fee: '€25M', step: 3, reliability: 60, updated: 'il y a 1j', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '4 ans',
    mv: '€22M', wage: '€4M/an', contractLen: '4 ans · 2030', contractUntil: '2026', fromLeague: 'Liga Nos', fromRank: '3ᵉ', toRank: '3ᵉ', posGroup: 'défensive' },
  { id: 11, window: 'e26', player: 'Javier Ortiz', posAge: 'GK · 29', posShort: 'Gardien', meta: 'Gardien · 29 ans · ESP', league: 'll',
    from: { name: 'Atlético', abbr: 'ATM', color: '#8a3535' }, to: { name: 'Sevilla', abbr: 'SEV', color: '#b03030' },
    fee: '€15M', step: 4, reliability: 72, updated: 'il y a 2j', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '3 ans',
    mv: '€12M', wage: '€3M/an', contractLen: '3 ans · 2029', contractUntil: '2026', fromLeague: 'La Liga', fromRank: '3ᵉ', toRank: '7ᵉ', posGroup: 'défensive' },
  { id: 12, window: 'e26', player: 'Felix Braun', posAge: 'LW · 24', posShort: 'Ailier gauche', meta: 'Ailier gauche · 24 ans · GER', league: 'bl',
    from: { name: 'Leipzig', abbr: 'LEI', color: '#c04a4a' }, to: { name: 'Dortmund', abbr: 'DOR', color: '#c9a227' },
    fee: '€40M', step: 5, reliability: 82, updated: 'il y a 6h', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '5 ans',
    mv: '€36M', wage: '€6M/an', contractLen: '5 ans · 2031', contractUntil: '2027', fromLeague: 'Bundesliga', fromRank: '4ᵉ', toRank: '1ᵉʳ', posGroup: 'offensive' },
  { id: 13, window: 'e26', player: 'Nathan Price', posAge: 'ST · 20', posShort: 'Avant-centre', meta: 'Avant-centre · 20 ans · ENG', league: 'pl',
    from: { name: 'Seaside', abbr: 'SEA', color: '#2f8a9a' }, to: { name: 'London City', abbr: 'LDN', color: '#6a8ac0' },
    fee: '€35M', step: 2, reliability: 44, updated: 'il y a 3j', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '5 ans',
    mv: '€28M', wage: '€5M/an', contractLen: '5 ans · 2031', contractUntil: '2027', fromLeague: 'Premier League', fromRank: '11ᵉ', toRank: '4ᵉ', posGroup: 'offensive' },

  // ===== HIVER 2026 (clôturé — officialisés) =====
  { id: 20, window: 'h26', player: 'Carlos Mendez', posAge: 'CM · 26', posShort: 'Milieu central', meta: 'Milieu central · 26 ans · URU', league: 'pl',
    from: { name: 'River', abbr: 'RIV', color: '#c23a3a' }, to: { name: 'Manchester', abbr: 'MCR', color: '#b0392b' },
    fee: '€40M', step: 6, reliability: 100, updated: 'janv. 2026', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '4 ans',
    mv: '€36M', wage: '€6M/an', contractLen: '4 ans · 2030', contractUntil: '2026', fromLeague: 'Primera AR', fromRank: '1ᵉʳ', toRank: '2ᵉ', posGroup: 'créative' },
  { id: 21, window: 'h26', player: 'Erik Sørensen', posAge: 'RB · 27', posShort: 'Latéral droit', meta: 'Latéral droit · 27 ans · DEN', league: 'pl',
    from: { name: 'Ajax', abbr: 'AJX', color: '#c85a3a' }, to: { name: 'Newcastle', abbr: 'NEW', color: '#3a4550' },
    fee: '€26M', step: 6, reliability: 100, updated: 'janv. 2026', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '3 ans',
    mv: '€22M', wage: '€4M/an', contractLen: '3 ans · 2029', contractUntil: '2026', fromLeague: 'Eredivisie', fromRank: '2ᵉ', toRank: '5ᵉ', posGroup: 'défensive' },
  { id: 22, window: 'h26', player: 'Paulo Vitor', posAge: 'AM · 24', posShort: 'Meneur de jeu', meta: 'Meneur de jeu · 24 ans · BRA', league: 'l1',
    from: { name: 'Benfica', abbr: 'BEN', color: '#b03030' }, to: { name: 'Paris SG', abbr: 'PSG', color: '#2a3a6a' },
    fee: '€52M', step: 6, reliability: 100, updated: 'févr. 2026', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '5 ans',
    mv: '€48M', wage: '€8M/an', contractLen: '5 ans · 2031', contractUntil: '2027', fromLeague: 'Liga Nos', fromRank: '1ᵉʳ', toRank: '1ᵉʳ', posGroup: 'créative' },
  { id: 23, window: 'h26', player: 'Hans Weber', posAge: 'DM · 25', posShort: 'Milieu défensif', meta: 'Milieu défensif · 25 ans · GER', league: 'bl',
    from: { name: 'Bremen', abbr: 'BRE', color: '#3a7a4a' }, to: { name: 'Dortmund', abbr: 'DOR', color: '#c9a227' },
    fee: '€30M', step: 6, reliability: 100, updated: 'janv. 2026', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '4 ans',
    mv: '€27M', wage: '€5M/an', contractLen: '4 ans · 2030', contractUntil: '2026', fromLeague: 'Bundesliga', fromRank: '9ᵉ', toRank: '1ᵉʳ', posGroup: 'défensive' },

  // ===== ÉTÉ 2025 (clôturé — officialisés) =====
  { id: 30, window: 'e25', player: 'Luca Moretti', posAge: 'CF · 28', posShort: 'Attaquant', meta: 'Attaquant · 28 ans · ITA', league: 'sa',
    from: { name: 'Napoli', abbr: 'NAP', color: '#2f7fb0' }, to: { name: 'Milan', abbr: 'MIL', color: '#a0402f' },
    fee: '€44M', step: 6, reliability: 100, updated: 'août 2025', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '4 ans',
    mv: '€40M', wage: '€7M/an', contractLen: '4 ans · 2029', contractUntil: '2025', fromLeague: 'Serie A', fromRank: '3ᵉ', toRank: '3ᵉ', posGroup: 'offensive' },
  { id: 31, window: 'e25', player: 'Adem Yılmaz', posAge: 'LW · 23', posShort: 'Ailier gauche', meta: 'Ailier gauche · 23 ans · TUR', league: 'l1',
    from: { name: 'Galatasaray', abbr: 'GAL', color: '#c0402a' }, to: { name: 'Marseille', abbr: 'OM', color: '#2f7fb0' },
    fee: '€20M', step: 6, reliability: 100, updated: 'juil. 2025', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '4 ans',
    mv: '€18M', wage: '€4M/an', contractLen: '4 ans · 2029', contractUntil: '2025', fromLeague: 'Süper Lig', fromRank: '1ᵉʳ', toRank: '2ᵉ', posGroup: 'offensive' },
  { id: 32, window: 'e25', player: 'Kai Johansson', posAge: 'CB · 26', posShort: 'Défenseur central', meta: 'Défenseur central · 26 ans · SWE', league: 'pl',
    from: { name: 'Copenhagen', abbr: 'CPH', color: '#4a6a9a' }, to: { name: 'Manchester', abbr: 'MCR', color: '#b0392b' },
    fee: '€38M', step: 6, reliability: 100, updated: 'juil. 2025', breaking: false, type: 'Transfert sec', typeShort: 'Sec', contract: '5 ans',
    mv: '€34M', wage: '€6M/an', contractLen: '5 ans · 2030', contractUntil: '2025', fromLeague: 'Superliga', fromRank: '1ᵉʳ', toRank: '2ᵉ', posGroup: 'défensive' },
];
