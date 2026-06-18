import { ClipboardCheck, GraduationCap, LayoutDashboard, LogOut, Wallet } from 'lucide-react';
import {
  ATTENDANCE_ROLES,
  ENROLLMENT_ROLES,
  FINANCE_ROLES,
  OFFICE_STAFF_ROLES,
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
  if (ENROLLMENT_ROLES.includes(role) && OFFICE_STAFF_ROLES.includes(role)) {
    items.push({
      href: '/app/eleves',
      label: 'Élèves',
      icon: GraduationCap,
    });
  }
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
  '/app/eleves': { title: 'Élèves' },
  '/app/eleves/nouveau': { title: 'Inscription', backHref: '/app/eleves' },
  '/app/impayes': { title: 'Recouvrement (ma classe)', backHref: '/app' },
  '/app/rapports': { title: 'Rapports', backHref: '/app' },
};

const APP_REPORT_PAGE_TITLES: Record<string, WaPageMeta> = {
  '/app/rapports/presences': { title: 'Rapports présences', backHref: '/app/rapports' },
  '/app/rapports/caisse': { title: 'Rapports caisse', backHref: '/app/rapports' },
  '/app/rapports/impayes': { title: 'Rapports impayés', backHref: '/app/rapports' },
  '/app/rapports/effectifs': { title: 'Effectifs', backHref: '/app/rapports' },
  '/app/rapports/presences/jour': { title: 'Rapport du jour', backHref: '/app/rapports/presences' },
  '/app/rapports/presences/hebdo': { title: 'Synthèse hebdo', backHref: '/app/rapports/presences' },
  '/app/rapports/presences/absences-repetees': {
    title: 'Absences répétées',
    backHref: '/app/rapports/presences',
  },
  '/app/rapports/presences/eleve': { title: 'Historique élève', backHref: '/app/rapports/presences' },
  '/app/rapports/caisse/journal': { title: 'Journal de caisse', backHref: '/app/rapports/caisse' },
  '/app/rapports/impayes/synthese': { title: 'Synthèse impayés', backHref: '/app/rapports/impayes' },
  '/app/rapports/impayes/liste': { title: 'Liste impayés', backHref: '/app/rapports/impayes' },
};

export function getAppMobilePageMeta(pathname: string): WaPageMeta {
  if (APP_PAGE_TITLES[pathname]) return APP_PAGE_TITLES[pathname]!;
  if (APP_REPORT_PAGE_TITLES[pathname]) return APP_REPORT_PAGE_TITLES[pathname]!;

  if (pathname.startsWith('/app/rapports/presences/')) {
    return { title: 'Rapports présences', backHref: '/app/rapports/presences' };
  }
  if (pathname.startsWith('/app/rapports/')) {
    return { title: 'Rapports', backHref: '/app/rapports' };
  }

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
