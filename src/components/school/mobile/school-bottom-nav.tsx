'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWaShell } from '@/lib/navigation/wa-shell-context';
import {
  APP_TAB_BY_HREF,
  useAppTabsOptional,
} from '@/lib/navigation/app-tab-context';
import type { SchoolNavItem } from '@/lib/navigation/school-nav';
import { cn } from '@/lib/utils';

function itemClasses(active: boolean) {
  return cn(
    'flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.625rem] font-medium transition-colors',
    active ? 'text-wa-accent' : 'text-wa-text-secondary',
  );
}

function ItemInner({ item, active }: { item: SchoolNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <>
      <Icon
        className={cn('size-[1.375rem]', active && 'stroke-[2.5]')}
        aria-hidden
      />
      {item.label}
    </>
  );
}

export function SchoolBottomNav() {
  const pathname = usePathname();
  const { bottomNav, isNavActive } = useWaShell();
  const tabs = useAppTabsOptional();
  // Sur la page racine /app, les onglets sont gardés en mémoire : on bascule
  // l'état local (0 ms) au lieu de naviguer.
  const inWorkspace = tabs != null && pathname === '/app';

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-wa-divider bg-wa-panel safe-bottom md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex h-[3.25rem] items-stretch">
        {bottomNav.map((item) => {
          const tabKey = APP_TAB_BY_HREF[item.href];
          if (inWorkspace && tabKey) {
            const active = tabs!.activeTab === tabKey;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => tabs!.selectTab(tabKey)}
                className={itemClasses(active)}
                aria-current={active ? 'page' : undefined}
              >
                <ItemInner item={item} active={active} />
              </button>
            );
          }

          const active = isNavActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={itemClasses(active)}
            >
              <ItemInner item={item} active={active} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
