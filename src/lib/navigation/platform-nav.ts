import { LayoutDashboard, Building2, History, Link2, LogOut } from 'lucide-react';
import type { ComponentType } from 'react';

export type PlatformNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

export const PLATFORM_BOTTOM_NAV: PlatformNavItem[] = [
  { href: '/platform', label: 'Accueil', icon: LayoutDashboard, exact: true },
  { href: '/platform/schools', label: 'Écoles', icon: Building2 },
  { href: '/platform/onboarding', label: 'Onboarding', icon: History },
  { href: '/platform/onboarding/new', label: 'Nouveau', icon: Link2, exact: true },
] as const;

export const PLATFORM_LOGOUT_ITEM = {
  href: '/logout',
  label: 'Déconnexion',
  icon: LogOut,
};

export function isPlatformNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const BOTTOM_TAB_PATHS = new Set([
  '/platform',
  '/platform/schools',
  '/platform/onboarding',
  '/platform/onboarding/new',
]);

export function shouldShowPlatformBottomNav(pathname: string): boolean {
  return BOTTOM_TAB_PATHS.has(pathname);
}

type PageMeta = {
  title: string;
  backHref?: string;
};

const PAGE_TITLES: Record<string, PageMeta> = {
  '/platform': { title: 'Plateforme' },
  '/platform/schools': { title: 'Établissements', backHref: '/platform' },
  '/platform/onboarding': { title: 'Liens onboarding', backHref: '/platform' },
  '/platform/onboarding/new': { title: 'Nouveau lien', backHref: '/platform/onboarding' },
};

export function getPlatformMobilePageMeta(pathname: string): PageMeta {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]!;

  const schoolMatch = pathname.match(/^\/platform\/schools\/([^/]+)$/);
  if (schoolMatch) {
    return { title: 'Détails école', backHref: '/platform/schools' };
  }

  return { title: 'Pema Class' };
}

