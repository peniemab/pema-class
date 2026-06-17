import { redirect } from 'next/navigation';
import { resolvePostLoginPath } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PostLoginPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      redirect('/');
    }

    const path = await resolvePostLoginPath(user.id);
    redirect(path);
  } catch {
    redirect('/?error=auth_unavailable');
  }
}
