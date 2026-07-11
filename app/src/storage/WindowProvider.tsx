import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { WindowId } from '../api/types';

interface WindowContextValue {
  window: WindowId;
  setWindow: (w: WindowId) => void;
}

const WindowContext = createContext<WindowContextValue | null>(null);

/** The selected mercato window (Été 2026 / Hiver 2026 / Été 2025) is shared between the Flux and Ligues tabs. */
export function WindowProvider({ children }: { children: ReactNode }) {
  const [window, setWindow] = useState<WindowId>('e26');
  const value = useMemo(() => ({ window, setWindow }), [window]);
  return <WindowContext.Provider value={value}>{children}</WindowContext.Provider>;
}

export function useWindowState() {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error('useWindowState must be used within a WindowProvider');
  return ctx;
}
