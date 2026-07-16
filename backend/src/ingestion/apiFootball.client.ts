// Client API-Football (api-sports.io). Non testé avec une vraie clé depuis cet
// environnement (aucune clé disponible ici) — câblé strictement sur la doc
// publique. Vérifie le premier run réel : `npm run sync:once` puis contrôle les
// logs avant de laisser tourner le planificateur automatique.
//
// Deux façons d'accéder à l'API sont supportées, au choix via API_FOOTBALL_HOST :
//  - direct (api-sports.io)      → header x-apisports-key
//  - via RapidAPI                → headers x-rapidapi-key / x-rapidapi-host

const DIRECT_HOST = 'v3.football.api-sports.io';
const RAPIDAPI_HOST = 'api-football-v1.p.rapidapi.com';

function baseUrlAndHeaders(): { base: string; headers: Record<string, string> } {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('API_FOOTBALL_KEY manquant dans la config');
  const viaRapidApi = process.env.API_FOOTBALL_VIA_RAPIDAPI === 'true';
  if (viaRapidApi) {
    return { base: `https://${RAPIDAPI_HOST}/v3`, headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': RAPIDAPI_HOST } };
  }
  return { base: `https://${DIRECT_HOST}`, headers: { 'x-apisports-key': key } };
}

/** Vrai si non vide, que la forme soit un tableau (v3) ou un objet de messages par champ. */
function aDesErreurs(errors: unknown): boolean {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  if (typeof errors === 'object') return Object.keys(errors).length > 0;
  return false;
}

async function apiFootballGet<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const { base, headers } = baseUrlAndHeaders();
  const url = new URL(base + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`API-Football ${path} → HTTP ${res.status}`);
  const json = (await res.json()) as { response: T; errors?: unknown };
  // L'API répond souvent HTTP 200 même en cas de clé invalide/quota dépassé, avec
  // le vrai problème caché dans `errors` — sans cette vérification, une erreur
  // d'authentification ressemble silencieusement à "aucun résultat".
  if (aDesErreurs(json.errors)) {
    throw new Error(`API-Football ${path} → ${JSON.stringify(json.errors)}`);
  }
  return json.response;
}

export interface ApiFootballTeam {
  team: { id: number; name: string };
}

export function getTeams(leagueApiId: number, season: number): Promise<ApiFootballTeam[]> {
  return apiFootballGet<ApiFootballTeam[]>('/teams', { league: leagueApiId, season });
}

export interface ApiFootballTransferEntry {
  date: string;
  type: string | null;
  teams: {
    // L'API renvoie parfois un objet avec id/name à null (agent libre, retraite,
    // club hors couverture) plutôt que d'omettre le champ — donc id/name restent
    // nullable même quand l'objet lui-même est présent.
    in: { id: number | null; name: string | null } | null;
    out: { id: number | null; name: string | null } | null;
  };
}

export interface ApiFootballPlayerTransfers {
  player: { id: number; name: string };
  transfers: ApiFootballTransferEntry[];
}

export function getTransfersForTeam(teamApiId: number): Promise<ApiFootballPlayerTransfers[]> {
  return apiFootballGet<ApiFootballPlayerTransfers[]>('/transfers', { team: teamApiId });
}

// Le plan gratuit d'API-Football restreint les endpoints par saison (dont /teams)
// aux saisons 2022 à 2024 (cf. erreur "Free plans do not have access to this
// season, try from 2022 to 2024."). Les identifiants de clubs qu'on y récupère
// sont des identifiants stables, réutilisables ensuite avec /transfers (qui, lui,
// n'est pas restreint par saison) — donc découvrir les clubs via une saison
// historique autorisée ne pose aucun problème d'actualité des données.
export const SAISON_DECOUVERTE_EQUIPES = 2023;
