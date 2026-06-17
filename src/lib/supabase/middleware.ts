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
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      user = data.user;
    }
  } catch {
    // Réseau lent (mobile) : ne pas envoyer au login si le cookie session est encore là.
    if (hasSupabaseAuthCookie(request) && !isPublicPath(pathname)) {
      supabaseResponse.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private',
      );
      return supabaseResponse;
    }
    user = null;
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (user && !isPublicPath(pathname)) {
    supabaseResponse.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private',
    );
  }

  if (user && pathname === '/') {
    if (request.nextUrl.searchParams.get('error') === 'no_profile') {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/post-login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
