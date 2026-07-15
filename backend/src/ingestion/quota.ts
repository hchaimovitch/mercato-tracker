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
export async function peutAppeler(provider: string, plafondJournalier: number): Promise<boolean> {
  const etat = await getEtatJson<QuotaState>(`quota:${provider}`, { jour: '', appels: 0 });
  const aujourdhui = new Date().toISOString().slice(0, 10);
  if (etat.jour !== aujourdhui) return true;
  return etat.appels < plafondJournalier;
}

export async function enregistrerAppel(provider: string): Promise<void> {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const etat = await getEtatJson<QuotaState>(`quota:${provider}`, { jour: aujourdhui, appels: 0 });
  const next = etat.jour === aujourdhui ? { jour: aujourdhui, appels: etat.appels + 1 } : { jour: aujourdhui, appels: 1 };
  await setEtatJson(`quota:${provider}`, next);
}

export async function appelsRestants(provider: string, plafondJournalier: number): Promise<number> {
  const etat = await getEtatJson<QuotaState>(`quota:${provider}`, { jour: '', appels: 0 });
  const aujourdhui = new Date().toISOString().slice(0, 10);
  if (etat.jour !== aujourdhui) return plafondJournalier;
  return Math.max(0, plafondJournalier - etat.appels);
}
