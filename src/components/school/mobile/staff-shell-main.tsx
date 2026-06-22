'use client';

import { useMemo } from 'react';
import type { StaffRole } from '@/lib/auth/types';
import { WaShellMain } from '@/components/school/mobile/wa-shell-main';
import { getAppBottomNavItems, getAppWaShellConfig } from '@/lib/navigation/app-nav';
import { WaShellProvider } from '@/lib/navigation/wa-shell-context';
import {
  APP_TAB_BY_HREF,
  AppTabProvider,
  type AppTabKey,
} from '@/lib/navigation/app-tab-context';
import { useTabRouter } from '@/lib/navigation/use-tab-router';
import { useCallback } from 'react';

type Props = {
  role: StaffRole;
  children: React.ReactNode;
};

/** Shell WhatsApp Business pour le personnel (même design que la direction). */
export function StaffShellMain({ role, children }: Props) {
  const config = useMemo(() => getAppWaShellConfig(role), [role]);
  const tabKeys = useMemo(
    () =>
      getAppBottomNavItems(role)
        .map((i) => APP_TAB_BY_HREF[i.href])
        .filter((k): k is AppTabKey => Boolean(k)),
    [role],
  );
  const { currentTab, selectTab } = useTabRouter<AppTabKey>('accueil', tabKeys);

  const tabForHref = useCallback(
    (href: string) => APP_TAB_BY_HREF[href] ?? null,
    [],
  );

  const tabValue = useMemo(
    () => ({
      activeTab: currentTab,
      selectTab,
      tabKeys,
      rootPath: '/app',
      tabForHref,
    }),
    [currentTab, selectTab, tabKeys, tabForHref],
  );

  return (
    <WaShellProvider config={config}>
      <AppTabProvider value={tabValue}>
        <WaShellMain>{children}</WaShellMain>
      </AppTabProvider>
    </WaShellProvider>
  );
}
