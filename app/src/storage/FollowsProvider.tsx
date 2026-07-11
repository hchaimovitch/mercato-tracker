import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'mercato.followedTransferIds';

interface FollowsContextValue {
  followedIds: number[];
  isFollowed: (id: number) => boolean;
  toggleFollow: (id: number) => void;
  ready: boolean;
}

const FollowsContext = createContext<FollowsContextValue | null>(null);

export function FollowsProvider({ children }: { children: ReactNode }) {
  const [followedIds, setFollowedIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setFollowedIds(JSON.parse(raw));
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<FollowsContextValue>(
    () => ({
      followedIds,
      isFollowed: (id: number) => followedIds.includes(id),
      toggleFollow: (id: number) => {
        setFollowedIds((prev) => {
          const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
      ready,
    }),
    [followedIds, ready],
  );

  return <FollowsContext.Provider value={value}>{children}</FollowsContext.Provider>;
}

export function useFollows() {
  const ctx = useContext(FollowsContext);
  if (!ctx) throw new Error('useFollows must be used within a FollowsProvider');
  return ctx;
}
