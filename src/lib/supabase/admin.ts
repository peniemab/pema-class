import { createClient } from '@supabase/supabase-js';
import { supabaseServiceRoleKey, supabaseUrl } from '@/lib/env';

/** Client service role — serveur uniquement, jamais côté client. */
export function createAdminClient() {
  const url = supabaseUrl();
  const key = supabaseServiceRoleKey();
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant pour les opérations admin.');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
