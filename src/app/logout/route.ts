import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Déconnexion en POST uniquement : un GET (lien, prefetch Next.js, crawler)
 * ne doit JAMAIS détruire la session — sinon faux logout en navigation.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}

/** GET inoffensif : redirige sans déconnecter (compat anciens liens / prefetch). */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/', request.url));
}
