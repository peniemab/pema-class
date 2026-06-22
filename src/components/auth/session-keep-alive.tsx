'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hasSupabaseAuthCookie } from '@/lib/offline/local-session';

const REFRESH_MS = 30 * 60 * 1000;

/**
 * Renouvelle la session Supabase en arrière-plan (focus + intervalle).
 * Comme Facebook : tant que l'app est utilisée, on reste connecté.
 */
export function SessionKeepAlive() {
  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      if (!hasSupabaseAuthCookie()) return;
      try {
        await supabase.auth.getSession();
      } catch {
        /* hors ligne — le cookie refresh reste valide */
      }
    }

    void refresh();

    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(refresh, REFRESH_MS);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
