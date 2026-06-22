'use client';

import { useCallback, useMemo } from 'react';
import { WaShellMain } from '@/components/school/mobile/wa-shell-main';
import {
  SCHOOL_BOTTOM_NAV,
  SCHOOL_WA_SHELL_CONFIG,
} from '@/lib/navigation/school-nav';
import { WaShellProvider } from '@/lib/navigation/wa-shell-context';
import {
  AppTabProvider,
  SCHOOL_TAB_BY_HREF,
  type AppTabKey,
} from '@/lib/navigation/app-tab-context';
import { useTabRouter } from '@/lib/navigation/use-tab-router';

type Props = {
  children: React.ReactNode;
};

export function SchoolShellMain({ children }: Props) {
  const tabKeys = useMemo(
    () =>
      SCHOOL_BOTTOM_NAV.map((i) => SCHOOL_TAB_BY_HREF[i.href]).filter(
        (k): k is AppTabKey => Boolean(k),
      ),
    [],
  );
  const { currentTab, selectTab } = useTabRouter<AppTabKey>('accueil', tabKeys);

  const tabForHref = useCallback(
    (href: string) => SCHOOL_TAB_BY_HREF[href] ?? null,
    [],
  );

  const tabValue = useMemo(
    () => ({
      activeTab: currentTab,
      selectTab,
      tabKeys,
      rootPath: '/school',
      tabForHref,
    }),
    [currentTab, selectTab, tabKeys, tabForHref],
  );

  return (
    <WaShellProvider config={SCHOOL_WA_SHELL_CONFIG}>
      <AppTabProvider value={tabValue}>
        <WaShellMain>{children}</WaShellMain>
      </AppTabProvider>
    </WaShellProvider>
  );
}
