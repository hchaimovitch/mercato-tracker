import { getEtatJson, setEtatJson } from '../repo/syncState.repo.js';

interface QuotaState {
  jour: string; // yyyy-mm-dd
  appels: number;
}

/**
 * Compteur de requêtes/jour par fournisseur, pour rester sous le quota gratuit
 * (100/jour chez API-Football) avec une marge de sécurité. Persisté en base pour
 * survivre aux redémarrages du process.
 */
export function peutAppeler(provider: string, plafondJournalier: number): boolean {
  const etat = getEtatJson<QuotaState>(`quota:${provider}`, { jour: '', appels: 0 });
  const aujourdhui = new Date().toISOString().slice(0, 10);
  if (etat.jour !== aujourdhui) return true;
  return etat.appels < plafondJournalier;
}

export function enregistrerAppel(provider: string): void {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const etat = getEtatJson<QuotaState>(`quota:${provider}`, { jour: aujourdhui, appels: 0 });
  const next = etat.jour === aujourdhui ? { jour: aujourdhui, appels: etat.appels + 1 } : { jour: aujourdhui, appels: 1 };
  setEtatJson(`quota:${provider}`, next);
}

export function appelsRestants(provider: string, plafondJournalier: number): number {
  const etat = getEtatJson<QuotaState>(`quota:${provider}`, { jour: '', appels: 0 });
  const aujourdhui = new Date().toISOString().slice(0, 10);
  if (etat.jour !== aujourdhui) return plafondJournalier;
  return Math.max(0, plafondJournalier - etat.appels);
}
