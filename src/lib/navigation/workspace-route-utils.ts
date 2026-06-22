import { APP_REPORTS_BASE, SCHOOL_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { normalizeWorkspaceHref } from '@/lib/navigation/workspace-overlay-routes';

/** Route canonique /school/* pour le routage interne (app → school). */
export function canonicalWorkspacePath(href: string): string {
  const path = normalizeWorkspaceHref(href);
  if (path.startsWith('/app/rapports')) {
    return path.replace('/app/rapports', '/school/rapports');
  }
  if (path.startsWith('/app/impayes')) {
    return path.replace('/app/impayes', '/school/impayes');
  }
  return path;
}

export function reportsBaseForHref(href: string): string {
  return normalizeWorkspaceHref(href).startsWith('/app/')
    ? APP_REPORTS_BASE
    : SCHOOL_REPORTS_BASE;
}

export function workspaceRootForHref(href: string): '/school' | '/app' {
  return normalizeWorkspaceHref(href).startsWith('/app/') ? '/app' : '/school';
}

export function buildWorkspaceHref(
  path: string,
  params: Record<string, string | undefined> = {},
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  const q = sp.toString();
  return q ? `${path}?${q}` : path;
}
