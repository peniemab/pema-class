import { NextResponse } from 'next/server';
import { resolvePostLoginPath } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const origin = new URL(request.url).origin;

  if (!user) {
    return NextResponse.redirect(new URL('/', origin));
  }

  const path = await resolvePostLoginPath(user.id);
  return NextResponse.redirect(new URL(path, origin));
}
