import { db } from '../db/client.js';

export async function getEtat(cle: string): Promise<string | undefined> {
  const rs = await db.execute({ sql: 'SELECT valeur FROM sync_state WHERE cle = @cle', args: { cle } });
  return rs.rows[0] ? (rs.rows[0] as any).valeur : undefined;
}

export async function setEtat(cle: string, valeur: string): Promise<void> {
  await db.execute({
    sql: "INSERT INTO sync_state (cle, valeur, updated_at) VALUES (@cle, @valeur, datetime('now')) ON CONFLICT(cle) DO UPDATE SET valeur=excluded.valeur, updated_at=datetime('now')",
    args: { cle, valeur },
  });
}

export async function getEtatJson<T>(cle: string, defaut: T): Promise<T> {
  const raw = await getEtat(cle);
  if (!raw) return defaut;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaut;
  }
}

export async function setEtatJson(cle: string, valeur: unknown): Promise<void> {
  await setEtat(cle, JSON.stringify(valeur));
}
