'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { brand } from '@/lib/brand';
import {
  PLATFORM_BOTTOM_NAV,
  PLATFORM_LOGOUT_ITEM,
  isPlatformNavActive,
} from '@/lib/navigation/platform-nav';
import { cn } from '@/lib/utils';

export function PlatformSideRail() {
  const pathname = usePathname();

  return (
    <aside
      className="no-print hidden h-dvh w-[4.5rem] shrink-0 flex-col items-center border-r border-white/10 bg-wa-header py-3 md:flex"
      aria-label="Navigation plateforme"
    >
      <Link
        href="/platform"
        prefetch={false}
        className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-primary shadow-sm"
        aria-label={brand.name}
      >
        {brand.initial}
      </Link>

      <nav className="flex w-full flex-1 flex-col items-center gap-1">
        {PLATFORM_BOTTOM_NAV.map((item) => {
          const active = isPlatformNavActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex size-11 items-center justify-center rounded-xl transition-colors',
                active
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="size-[1.375rem]" aria-hidden />
            </Link>
          );
        })}
      </nav>

      <Link
        href={PLATFORM_LOGOUT_ITEM.href}
        title={PLATFORM_LOGOUT_ITEM.label}
        aria-label={PLATFORM_LOGOUT_ITEM.label}
        className="mt-2 flex size-11 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-5" aria-hidden />
      </Link>
    </aside>
  );
}

