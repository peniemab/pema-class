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
import { cn } from '@/lib/utils';

export function SchoolSideRail() {
  const pathname = usePathname();

  return (
    <aside
      className="no-print hidden w-[4.5rem] shrink-0 flex-col items-center border-r border-primary/20 bg-primary-dark py-3 md:flex"
      aria-label="Navigation principale"
    >
      <Link
        href="/school"
        className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm"
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
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex size-11 items-center justify-center rounded-xl transition-colors',
                active
                  ? 'bg-primary/25 text-primary-light'
                  : 'text-primary-light/70 hover:bg-primary/15 hover:text-primary-light',
              )}
            >
              <Icon className="size-[1.375rem]" aria-hidden />
            </Link>
          );
        })}
      </nav>

      <Link
        href={SCHOOL_LOGOUT_ITEM.href}
        title={SCHOOL_LOGOUT_ITEM.label}
        aria-label={SCHOOL_LOGOUT_ITEM.label}
        className="mt-2 flex size-11 items-center justify-center rounded-xl text-primary-light/70 transition-colors hover:bg-primary/15 hover:text-primary-light"
      >
        <LogOut className="size-5" aria-hidden />
      </Link>
    </aside>
  );
}
