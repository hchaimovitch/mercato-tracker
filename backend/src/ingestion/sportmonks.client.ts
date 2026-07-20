// Client SportMonks Transfer Rumours (add-on payant, prix non public — voir
// audit). Non testé avec une vraie clé depuis cet environnement. Actif
// uniquement si SPORTMONKS_KEY est configurée (voir isSportmonksActif) : sans
// clé, l'app fonctionne normalement avec uniquement les transferts officiels.

import { fetchAvecTimeout } from './fetchAvecTimeout.js';

const BASE = 'https://api.sportmonks.com/v3/football';

export function isSportmonksActif(): boolean {
  return !!process.env.SPORTMONKS_KEY;
}

export interface SportmonksRumeur {
  id: number;
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  source_name: string | null;
  source_url: string | null;
  date: string;
  fee: number | null;
  player: { id: number; name: string } | null;
  fromTeam: { id: number; name: string } | null;
  toTeam: { id: number; name: string } | null;
}

interface SportmonksResponse<T> {
  data: T;
  pagination?: { current_page: number; has_more: boolean };
}

async function sportmonksGet<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const key = process.env.SPORTMONKS_KEY;
  if (!key) throw new Error('SPORTMONKS_KEY manquant dans la config');

  const results: T[] = [];
  let page = 1;
  for (;;) {
    const url = new URL(BASE + path);
    url.searchParams.set('api_token', key);
    url.searchParams.set('include', 'player;fromTeam;toTeam');
    url.searchParams.set('per_page', '50');
    url.searchParams.set('page', String(page));
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetchAvecTimeout(url.toString());
    if (!res.ok) throw new Error(`SportMonks ${path} → HTTP ${res.status}`);
    const json = (await res.json()) as SportmonksResponse<T[]>;
    results.push(...json.data);
    if (!json.pagination?.has_more) break;
    page++;
    if (page > 20) break; // garde-fou, ne devrait jamais être atteint pour une fenêtre de quelques jours
  }
  return results;
}

/** Rumeurs rapportées entre deux dates (YYYY-MM-DD) — endpoint dédié au polling incrémental. */
export function getRumeursEntreDates(debut: string, fin: string): Promise<SportmonksRumeur[]> {
  return sportmonksGet<SportmonksRumeur>(`/transfer-rumours/between/${debut}/${fin}`);
}
