import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  // Reuse the Metro dev-server host so a phone on the same LAN (Expo Go / dev build)
  // can reach the backend without hardcoding an IP.
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:4000`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}

export const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function buildUrl(path: string, params?: Record<string, string | undefined>): URL {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }
  return url;
}

export async function fetchJson<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = buildUrl(path, params);
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText} — ${url.toString()}`);
  }
  return (await res.json()) as T;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText} — ${url.toString()}`);
  }
  return (await res.json()) as T;
}

export async function deleteRequest(path: string, params?: Record<string, string | undefined>): Promise<void> {
  const url = buildUrl(path, params);
  const res = await fetch(url.toString(), { method: 'DELETE' });
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText} — ${url.toString()}`);
  }
}
