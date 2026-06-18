'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWaShell } from '@/lib/navigation/wa-shell-context';
import { cn } from '@/lib/utils';

export function SchoolBottomNav() {
  const pathname = usePathname();
  const { bottomNav, isNavActive } = useWaShell();

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-wa-divider bg-wa-panel safe-bottom md:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex h-[3.25rem] items-stretch">
        {bottomNav.map((item) => {
          const active = isNavActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.625rem] font-medium transition-colors',
                active ? 'text-wa-accent' : 'text-wa-text-secondary',
              )}
            >
              <Icon
                className={cn('size-[1.375rem]', active && 'stroke-[2.5]')}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
