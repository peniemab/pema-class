import { NextResponse } from 'next/server';
import { resolvePostLoginPath } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  try {
    const supabase = await createClient();
    await supabase.auth.getSession();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL('/?error=session', origin));
    }

    const path = await resolvePostLoginPath(user.id);
    return NextResponse.redirect(new URL(path, origin));
  } catch {
    return NextResponse.redirect(new URL('/?error=auth_unavailable', origin));
  }
}
