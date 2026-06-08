import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/env';

export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

export { isSupabaseConfigured };
