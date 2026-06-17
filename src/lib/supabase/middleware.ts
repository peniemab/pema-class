import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/env';

/** Routes accessibles sans session (inscription par lien d'invitation incluse). */
const PUBLIC_PATHS = [
  '/',
  '/register',
  '/join',
  '/logout',
  '/~offline',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/post-login',
  '/presentation',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname === '/manifest.webmanifest') return true;
  if (pathname.startsWith('/icons/')) return true;
  return false;
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.includes('-auth-token'));
}

/** Copie les cookies Supabase (refresh token) sur les redirects — sinon boucle / ↔ /post-login. */
function withSupabaseCookies(
  target: NextResponse,
  source: NextResponse,
): NextResponse {
  source.cookies.getAll().forEach(({ name, value }) => {
    target.cookies.set(name, value);
  });
  return target;
}

function redirectWithSession(
  url: URL,
  supabaseResponse: NextResponse,
): NextResponse {
  return withSupabaseCookies(NextResponse.redirect(url), supabaseResponse);
}

function allowSessionCookieThrough(
  request: NextRequest,
  pathname: string,
  supabaseResponse: NextResponse,
): NextResponse | null {
  if (!hasSupabaseAuthCookie(request) || isPublicPath(pathname)) return null;
  supabaseResponse.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private',
  );
  return supabaseResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  let user: { id: string } | null = null;
  let reason = 'nouser';
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      user = data.user;
    } else if (error) {
      reason = `err_${(error.message || 'unknown').slice(0, 40).replace(/[^a-zA-Z0-9_]+/g, '-')}`;
      const passthrough = allowSessionCookieThrough(request, pathname, supabaseResponse);
      if (passthrough) return passthrough;
    }
  } catch (e) {
    reason = `throw_${(e instanceof Error ? e.message : 'unknown').slice(0, 40).replace(/[^a-zA-Z0-9_]+/g, '-')}`;
    const passthrough = allowSessionCookieThrough(request, pathname, supabaseResponse);
    if (passthrough) return passthrough;
    user = null;
  }

  if (!user && !isPublicPath(pathname)) {
    const hasCookie = hasSupabaseAuthCookie(request);
    if (!hasCookie) reason = 'nocookie';
    // Diagnostic : visible dans Vercel → Runtime Logs.
    console.warn(
      `[auth-redirect] path=${pathname} reason=${reason} hasCookie=${hasCookie}`,
    );
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    url.searchParams.set('error', 'session');
    url.searchParams.set('reason', reason);
    return redirectWithSession(url, supabaseResponse);
  }

  if (user && !isPublicPath(pathname)) {
    supabaseResponse.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private',
    );
  }

  // Ne pas auto-rediriger / → /post-login (boucle avec la page post-login).
  // La redirection post-connexion est déclenchée uniquement par le formulaire login.

  return supabaseResponse;
}
