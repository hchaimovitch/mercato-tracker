/**
 * `fetch()` n'a pas de timeout par défaut — observé en production sur
 * API-Football : après quelques requêtes, un compte suspendu ne renvoie plus
 * une erreur rapide mais fait taire la connexion (pas de réponse, pas de
 * rejet), ce qui gèle indéfiniment tout le cycle de synchronisation (aucun
 * fournisseur suivant, y compris les rumeurs RSS/Claude, ne s'exécute alors).
 * Utilisé par tous les clients HTTP de ce backend pour garantir qu'un appel
 * externe échoue toujours au bout d'un temps borné plutôt que de bloquer.
 */
const TIMEOUT_PAR_DEFAUT_MS = 15_000;

export async function fetchAvecTimeout(url: string, options: RequestInit = {}, timeoutMs = TIMEOUT_PAR_DEFAUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
