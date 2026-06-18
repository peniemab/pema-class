'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { brand } from '@/lib/brand';
import {
  SCHOOL_BOTTOM_NAV,
  SCHOOL_LOGOUT_ITEM,
  isSchoolNavActive,
} from '@/lib/navigation/school-nav';
import { LogoutButton } from '@/components/auth/logout-button';
import { cn } from '@/lib/utils';

export function SchoolSideRail() {
  const pathname = usePathname();

  return (
    <aside
      className="no-print hidden h-dvh w-[4.5rem] shrink-0 flex-col items-center border-r border-white/10 bg-wa-header py-3 md:flex"
      aria-label="Navigation principale"
    >
      <Link
        href="/school"
        prefetch={false}
        className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-primary shadow-sm"
        aria-label={brand.name}
      >
        {brand.initial}
      </Link>

      <nav className="flex w-full flex-1 flex-col items-center gap-1">
        {SCHOOL_BOTTOM_NAV.map((item) => {
          const active = isSchoolNavActive(pathname, item.href, item.exact);
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

      <LogoutButton
        label={SCHOOL_LOGOUT_ITEM.label}
        className="mt-2 flex size-11 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-5" aria-hidden />
      </LogoutButton>
    </aside>
  );
}
