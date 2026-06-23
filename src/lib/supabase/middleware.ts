import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/env';
import { OFFLINE_BOOT_COOKIE } from '@/lib/offline/local-session';

/** Routes accessibles sans session (inscription par lien d'invitation incluse). */
const PUBLIC_PATHS = [
  '/',
  '/boot',
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

const WORKSPACE_PREFIXES = ['/app', '/school', '/boot'] as const;

function isWorkspacePath(pathname: string): boolean {
  return WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

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

function hasOfflineBootCookie(request: NextRequest): boolean {
  return request.cookies.get(OFFLINE_BOOT_COOKIE)?.value === '1';
}

function allowOfflineWorkspaceThrough(
  request: NextRequest,
  pathname: string,
  supabaseResponse: NextResponse,
): NextResponse | null {
  if (!isWorkspacePath(pathname)) return null;
  if (!hasSupabaseAuthCookie(request) && !hasOfflineBootCookie(request)) {
    return null;
  }
  supabaseResponse.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private',
  );
  return supabaseResponse;
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

/**
 * Session persistante (Facebook / WhatsApp) :
 * - refresh silencieux du JWT via getSession()
 * - jamais de kick si le cookie refresh existe encore
 * - login (/) ignoré quand déjà connecté
 */
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

  try {
    // Renouvelle l'access token à partir du refresh token (cookie longue durée).
    await supabase.auth.getSession();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      user = data.user;
    }
  } catch {
    /* réseau ou auth indisponible — on s'appuie sur le cookie refresh */
  }

  if (!user) {
    const passthrough =
      allowSessionCookieThrough(request, pathname, supabaseResponse) ??
      allowOfflineWorkspaceThrough(request, pathname, supabaseResponse);
    if (passthrough) return passthrough;
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    url.searchParams.set('error', 'session');
    return redirectWithSession(url, supabaseResponse);
  }

  if (user && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/post-login';
    url.search = '';
    return redirectWithSession(url, supabaseResponse);
  }

  if (user && !isPublicPath(pathname)) {
    supabaseResponse.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private',
    );
  }

  return supabaseResponse;
}
