import { ClipboardCheck, LayoutDashboard, LogOut, Wallet } from 'lucide-react';
import {
  ATTENDANCE_ROLES,
  FINANCE_ROLES,
  type StaffRole,
} from '@/lib/auth/types';
import type { WaPageMeta, WaShellConfig } from '@/lib/navigation/wa-shell-context';
import type { SchoolNavItem } from '@/lib/navigation/school-nav';

export const APP_LOGOUT_ITEM = {
  href: '/logout',
  label: 'Déconnexion',
  icon: LogOut,
};

export function isAppNavActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  if (exact) return pathname === href;
  return (
    pathname === href ||
    (href !== '/app' && pathname.startsWith(`${href}/`))
  );
}

/** Onglets bas d’écran selon le rôle (même style que la direction). */
export function getAppBottomNavItems(role: StaffRole): SchoolNavItem[] {
  const items: SchoolNavItem[] = [
    { href: '/app', label: 'Accueil', icon: LayoutDashboard, exact: true },
  ];
  if (ATTENDANCE_ROLES.includes(role)) {
    items.push({
      href: '/app/presences',
      label: 'Présences',
      icon: ClipboardCheck,
    });
  }
  if (FINANCE_ROLES.includes(role)) {
    items.push({ href: '/app/caisse', label: 'Caisse', icon: Wallet });
  }
  return items;
}

const APP_PAGE_TITLES: Record<string, WaPageMeta> = {
  '/app': { title: 'Accueil' },
  '/app/presences': { title: 'Présences' },
  '/app/caisse': { title: 'Caisse' },
};

export function getAppMobilePageMeta(pathname: string): WaPageMeta {
  if (APP_PAGE_TITLES[pathname]) return APP_PAGE_TITLES[pathname]!;

  const caisseMatch = pathname.match(/^\/app\/caisse\/([^/]+)$/);
  if (caisseMatch) {
    return { title: 'Encaissement', backHref: '/app/caisse' };
  }

  return { title: 'Pema Class' };
}

export function shouldShowAppBottomNav(
  pathname: string,
  role: StaffRole,
): boolean {
  const tabs = new Set(getAppBottomNavItems(role).map((i) => i.href));
  return tabs.has(pathname);
}

export function getAppWaShellConfig(role: StaffRole): WaShellConfig {
  const bottomNav = getAppBottomNavItems(role);
  const tabPaths = new Set(bottomNav.map((i) => i.href));
  return {
    homeHref: '/app',
    bottomNav,
    getPageMeta: getAppMobilePageMeta,
    shouldShowBottomNav: (pathname) => tabPaths.has(pathname),
    isNavActive: isAppNavActive,
  };
}
