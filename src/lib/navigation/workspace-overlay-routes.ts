import { getSchoolMobilePageMeta } from '@/lib/navigation/school-nav';
import { getAppMobilePageMeta } from '@/lib/navigation/app-nav';

/** Préfixes de routes ouvrables en overlay depuis le workspace. */
const WORKSPACE_OVERLAY_PREFIXES = [
  '/school/rapports',
  '/school/impayes',
  '/school/parametres',
  '/app/rapports',
  '/app/impayes',
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
  const path = normalizeWorkspaceHref(href);
  if (path.startsWith('/app/')) {
    return getAppMobilePageMeta(path).title;
  }
  return getSchoolMobilePageMeta(path).title;
}
