'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand-mark';
import {
  SCHOOL_SIDEBAR_NAV,
  isSchoolNavActive,
  type SchoolNavItem,
} from '@/lib/navigation/school-nav';
import { LogoutButton } from '@/components/auth/logout-button';

export type SidebarNavItem = SchoolNavItem;

const PLATFORM_NAV: SchoolNavItem[] = [
  { href: '/platform', label: 'Plateforme', icon: Building2, exact: true },
];

const APP_NAV: SchoolNavItem[] = [
  { href: '/app', label: 'Accueil', icon: SCHOOL_SIDEBAR_NAV[0]!.icon, exact: true },
  { href: '/app/presences', label: 'Présences', icon: SCHOOL_SIDEBAR_NAV[2]!.icon },
  { href: '/app/caisse', label: 'Caisse', icon: SCHOOL_SIDEBAR_NAV[3]!.icon },
];

type AppSidebarProps = {
  variant: 'platform' | 'school' | 'app';
  className?: string;
};

export function AppSidebar({ variant, className }: AppSidebarProps) {
  const pathname = usePathname();
  const items =
    variant === 'platform'
      ? PLATFORM_NAV
      : variant === 'school'
        ? SCHOOL_SIDEBAR_NAV
        : APP_NAV;

  return (
    <aside
      className={cn(
        'no-print flex w-56 shrink-0 flex-col border-r bg-card',
        className,
      )}
    >
      <div className="border-b px-4 py-4">
        <BrandMark size="sm" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active = isSchoolNavActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <LogoutButton
          label="Déconnexion"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
          Déconnexion
        </LogoutButton>
      </div>
    </aside>
  );
}
