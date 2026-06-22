import { getSchoolMobilePageMeta } from '@/lib/navigation/school-nav';

/** Préfixes de routes ouvrables en overlay depuis le workspace /school. */
const WORKSPACE_OVERLAY_PREFIXES = [
  '/school/rapports',
  '/school/impayes',
  '/school/parametres',
] as const;

export function isWorkspaceOverlayHref(href: string): boolean {
  const path = normalizeWorkspaceHref(href);
  return WORKSPACE_OVERLAY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function normalizeWorkspaceHref(href: string): string {
  return href.split('#')[0].split('?')[0];
}

export function overlayTitleForHref(href: string): string {
  return getSchoolMobilePageMeta(normalizeWorkspaceHref(href)).title;
}
