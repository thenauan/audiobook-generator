// ===== Contexto do app =====
// O estado vem de useAppState() (no App) e chega às telas e camadas por useApp().
import { createContext, useContext } from 'react';
import type { AppState } from './useAppState';

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const app = useContext(AppContext);
  if (!app) throw new Error('useApp() precisa estar dentro de <AppContext.Provider>');
  return app;
}
