import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Centralized Supabase client configuration.
 *
 * - `getSupabaseClient()` uses the anon key and is used to verify user access
 *   tokens (`auth.getUser(token)`). Verifying a token never requires the
 *   service-role key.
 * - `getSupabaseAdminClient()` uses the service-role key for privileged
 *   server-side operations. This key must never reach the browser and must
 *   never be logged.
 *
 * Both are lazy singletons so that importing this module has no side effects
 * and public routes (e.g. GET /api/health) keep working even if Supabase env
 * vars are absent.
 */

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
} as const;

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!anonClient) {
    if (!env.supabase.url || !env.supabase.anonKey) {
      throw new Error(
        'Supabase is not configured: set SUPABASE_URL and SUPABASE_ANON_KEY',
      );
    }
    console.log("Supabase URL:", env.supabase.url);
console.log(
  "Supabase anon key loaded:",
  Boolean(env.supabase.anonKey),
);
    anonClient = createClient(
      env.supabase.url,
      env.supabase.anonKey,
      clientOptions,
    );
  }
  return anonClient;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    if (!env.supabase.url || !env.supabase.serviceRoleKey) {
      throw new Error(
        'Supabase admin is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      );
    }
    adminClient = createClient(
      env.supabase.url,
      env.supabase.serviceRoleKey,
      clientOptions,
    );
  }
  return adminClient;
}
