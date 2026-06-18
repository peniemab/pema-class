import { appBaseUrl } from '@/lib/env';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * URL publique de l'app côté navigateur.
 * Doit correspondre à Supabase → Authentication → URL Configuration (Site URL + Redirect URLs).
 */
export function publicAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const fromEnv = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();
    if (fromEnv) return stripTrailingSlash(fromEnv);
    return window.location.origin;
  }
  return stripTrailingSlash(appBaseUrl());
}

/** Lien de retour après e-mail Supabase (reset MDP, confirmation, etc.). */
export function authCallbackUrl(nextPath: string): string {
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  const params = new URLSearchParams({ next });
  return `${publicAppBaseUrl()}/auth/callback?${params.toString()}`;
}

export const AUTH_RESET_PASSWORD_CALLBACK = '/auth/reset-password';
