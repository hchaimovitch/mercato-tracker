import { fetchAvecTimeout } from './fetchAvecTimeout.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface NotificationPush {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Envoie une notification via le service push gratuit d'Expo — aucune clé
 * requise ici, l'authentification FCM/APNs est gérée côté Expo à partir des
 * identifiants uploadés sur le projet EAS (voir README). Best-effort : les
 * erreurs sont logguées par l'appelant, jamais laissées interrompre le
 * pipeline de synchronisation.
 */
export async function envoyerNotification(n: NotificationPush): Promise<void> {
  const res = await fetchAvecTimeout(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify([{ to: n.to, title: n.title, body: n.body, data: n.data ?? {} }]),
  });
  if (!res.ok) throw new Error(`Expo push → HTTP ${res.status}`);
  const json = (await res.json()) as { data?: { status: string; message?: string }[] };
  const ticket = json.data?.[0];
  if (ticket?.status === 'error') throw new Error(`Expo push → ${ticket.message ?? 'erreur inconnue'}`);
}
