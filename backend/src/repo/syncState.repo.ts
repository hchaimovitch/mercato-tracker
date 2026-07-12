import { db } from '../db/client.js';

const stmtGet = db.prepare<{ cle: string }, { valeur: string }>('SELECT valeur FROM sync_state WHERE cle = @cle');
const stmtSet = db.prepare<{ cle: string; valeur: string }>(
  "INSERT INTO sync_state (cle, valeur, updated_at) VALUES (@cle, @valeur, datetime('now')) ON CONFLICT(cle) DO UPDATE SET valeur=excluded.valeur, updated_at=datetime('now')",
);

export function getEtat(cle: string): string | undefined {
  return stmtGet.get({ cle })?.valeur;
}

export function setEtat(cle: string, valeur: string): void {
  stmtSet.run({ cle, valeur });
}

export function getEtatJson<T>(cle: string, defaut: T): T {
  const raw = getEtat(cle);
  if (!raw) return defaut;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaut;
  }
}

export function setEtatJson(cle: string, valeur: unknown): void {
  setEtat(cle, JSON.stringify(valeur));
}
