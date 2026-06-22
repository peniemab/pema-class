'use client';

import { createContext, useContext } from 'react';

export type AppTabKey =
  | 'accueil'
  | 'eleves'
  | 'presences'
  | 'caisse'
  | 'outils';

/** Correspondance href de la nav → clé d'onglet (espace personnel /app). */
export const APP_TAB_BY_HREF: Record<string, AppTabKey> = {
  '/app': 'accueil',
  '/app/eleves': 'eleves',
  '/app/presences': 'presences',
  '/app/caisse': 'caisse',
};

/** Correspondance href de la nav → clé d'onglet (direction /school). */
export const SCHOOL_TAB_BY_HREF: Record<string, AppTabKey> = {
  '/school': 'accueil',
  '/school/eleves': 'eleves',
  '/school/presences': 'presences',
  '/school/caisse': 'caisse',
  '/school/outils': 'outils',
};

/** Titre affiché dans le header selon l'onglet actif. */
export const APP_TAB_TITLES: Record<AppTabKey, string> = {
  accueil: 'Accueil',
  eleves: 'Élèves',
  presences: 'Présences',
  caisse: 'Caisse',
  outils: 'Outils',
};

type AppTabContextValue = {
  activeTab: AppTabKey;
  selectTab: (key: AppTabKey) => void;
  tabKeys: AppTabKey[];
  /** Racine du workspace (`/app` ou `/school`). */
  rootPath: string;
  /** Convertit un href de nav en clé d'onglet (ou null si hors workspace). */
  tabForHref: (href: string) => AppTabKey | null;
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

/** Optionnel : `null` hors d'un workspace à onglets. */
export function useAppTabsOptional(): AppTabContextValue | null {
  return useContext(AppTabContext);
}
