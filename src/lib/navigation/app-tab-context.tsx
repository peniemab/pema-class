'use client';

import { createContext, useContext } from 'react';

export type AppTabKey = 'accueil' | 'eleves' | 'presences' | 'caisse';

/** Correspondance href de la bottom nav → clé d'onglet du workspace. */
export const APP_TAB_BY_HREF: Record<string, AppTabKey> = {
  '/app': 'accueil',
  '/app/eleves': 'eleves',
  '/app/presences': 'presences',
  '/app/caisse': 'caisse',
};

/** Titre affiché dans le header selon l'onglet actif. */
export const APP_TAB_TITLES: Record<AppTabKey, string> = {
  accueil: 'Accueil',
  eleves: 'Élèves',
  presences: 'Présences',
  caisse: 'Caisse',
};

type AppTabContextValue = {
  activeTab: AppTabKey;
  selectTab: (key: AppTabKey) => void;
  tabKeys: AppTabKey[];
};

const AppTabContext = createContext<AppTabContextValue | null>(null);

export function AppTabProvider({
  value,
  children,
}: {
  value: AppTabContextValue;
  children: React.ReactNode;
}) {
  return (
    <AppTabContext.Provider value={value}>{children}</AppTabContext.Provider>
  );
}

/** Optionnel : `null` hors du shell personnel (/school n'est pas concerné). */
export function useAppTabsOptional(): AppTabContextValue | null {
  return useContext(AppTabContext);
}
