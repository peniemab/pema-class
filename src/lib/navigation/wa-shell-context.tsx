'use client';

import { createContext, useContext } from 'react';
import type { SchoolNavItem } from '@/lib/navigation/school-nav';

export type WaPageMeta = {
  title: string;
  backHref?: string;
};

export type WaShellConfig = {
  homeHref: string;
  bottomNav: SchoolNavItem[];
  getPageMeta: (pathname: string) => WaPageMeta;
  shouldShowBottomNav: (pathname: string) => boolean;
  isNavActive: (pathname: string, href: string, exact?: boolean) => boolean;
};

const WaShellContext = createContext<WaShellConfig | null>(null);

export function WaShellProvider({
  config,
  children,
}: {
  config: WaShellConfig;
  children: React.ReactNode;
}) {
  return (
    <WaShellContext.Provider value={config}>{children}</WaShellContext.Provider>
  );
}

export function useWaShell(): WaShellConfig {
  const ctx = useContext(WaShellContext);
  if (!ctx) {
    throw new Error('useWaShell doit être utilisé dans un WaShellProvider.');
  }
  return ctx;
}
