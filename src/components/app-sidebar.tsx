'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand-mark';

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SCHOOL_NAV: SidebarNavItem[] = [
  { href: '/school', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/school/team', label: 'Équipe', icon: Users },
  { href: '/school/parametres', label: 'Paramètres', icon: Settings },
];

const PLATFORM_NAV: SidebarNavItem[] = [
  { href: '/platform', label: 'Plateforme', icon: Building2 },
];

const APP_NAV: SidebarNavItem[] = [
  { href: '/app', label: 'Accueil', icon: LayoutDashboard },
];

type AppSidebarProps = {
  variant: 'platform' | 'school' | 'app';
};

export function AppSidebar({ variant }: AppSidebarProps) {
  const pathname = usePathname();
  const items =
    variant === 'platform'
      ? PLATFORM_NAV
      : variant === 'school'
        ? SCHOOL_NAV
        : APP_NAV;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
      <div className="border-b px-4 py-4">
        <BrandMark size="sm" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/school' &&
              item.href !== '/app' &&
              item.href !== '/platform' &&
              pathname.startsWith(item.href));
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
        <Link
          href="/logout"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
          Déconnexion
        </Link>
      </div>
    </aside>
  );
}
