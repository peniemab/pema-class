import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAnonKey, supabaseUrl } from '@/lib/env';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (!code) {
    const redirectUrl = new URL(next, url.origin);
    redirectUrl.searchParams.set('error', 'auth_callback_missing_code');
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const redirectUrl = new URL(next, url.origin);
    redirectUrl.searchParams.set('error', 'auth_callback_exchange_failed');
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

