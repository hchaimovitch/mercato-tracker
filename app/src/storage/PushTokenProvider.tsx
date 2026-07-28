import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

interface PushTokenContextValue {
  pushToken: string | null;
  ready: boolean;
  /** Non-null si l'enregistrement a échoué (permission refusée, pas de projet EAS lié, etc.) — voir README. */
  error: string | null;
}

const PushTokenContext = createContext<PushTokenContextValue | null>(null);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Alertes transferts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  // Nécessite un projet EAS lié (extra.eas.projectId dans app.json, généré par
  // `eas init`/`eas build`) — voir README pour la configuration Firebase/FCM V1
  // requise en plus de ça pour que l'envoi fonctionne réellement sur Android.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
  if (!projectId) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

export function PushTokenProvider({ children }: { children: ReactNode }) {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(setPushToken)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<PushTokenContextValue>(() => ({ pushToken, ready, error }), [pushToken, ready, error]);

  return <PushTokenContext.Provider value={value}>{children}</PushTokenContext.Provider>;
}

export function usePushToken() {
  const ctx = useContext(PushTokenContext);
  if (!ctx) throw new Error('usePushToken must be used within a PushTokenProvider');
  return ctx;
}
