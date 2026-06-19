'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { brand } from '@/lib/brand';
import { SCHOOL_LOGOUT_ITEM } from '@/lib/navigation/school-nav';
import { useWaShell } from '@/lib/navigation/wa-shell-context';
import {
  APP_TAB_BY_HREF,
  useAppTabsOptional,
} from '@/lib/navigation/app-tab-context';
import { LogoutButton } from '@/components/auth/logout-button';
import { cn } from '@/lib/utils';

export function SchoolSideRail() {
  const pathname = usePathname();
  const { homeHref, bottomNav, isNavActive } = useWaShell();
  const tabs = useAppTabsOptional();
  // Sur /app, bascule d'onglet instantanée (état local) au lieu de naviguer.
  const inWorkspace = tabs != null && pathname === '/app';

  return (
    <aside
      className="no-print hidden h-dvh w-[4.5rem] shrink-0 flex-col items-center border-r border-white/10 bg-wa-header py-3 md:flex"
      aria-label="Navigation principale"
    >
      {inWorkspace ? (
        <button
          type="button"
          onClick={() => tabs!.selectTab('accueil')}
          className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-primary shadow-sm"
          aria-label={brand.name}
        >
          {brand.initial}
        </button>
      ) : (
        <Link
          href={homeHref}
          prefetch={false}
          className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-primary shadow-sm"
          aria-label={brand.name}
        >
          {brand.initial}
        </Link>
      )}

      <nav className="flex w-full flex-1 flex-col items-center gap-1">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const tabKey = APP_TAB_BY_HREF[item.href];
          const railClasses = (active: boolean) =>
            cn(
              'flex size-11 items-center justify-center rounded-xl transition-colors',
              active
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            );

          if (inWorkspace && tabKey) {
            const active = tabs!.activeTab === tabKey;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => tabs!.selectTab(tabKey)}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={railClasses(active)}
              >
                <Icon className="size-[1.375rem]" aria-hidden />
              </button>
            );
          }

          const active = isNavActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={railClasses(active)}
            >
              <Icon className="size-[1.375rem]" aria-hidden />
            </Link>
          );
        })}
      </nav>

      <LogoutButton
        label={SCHOOL_LOGOUT_ITEM.label}
        className="mt-2 flex size-11 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-5" aria-hidden />
      </LogoutButton>
    </aside>
  );
}
