import { getSupabaseAdminClient } from '../config/supabaseClient';
import { ROLES, type Role } from '../constants/roles';

/**
 * Looks up a user's application role from `profiles` using the service-role
 * client — this is the single source of truth for authorization checks and
 * must never be derived from a client-supplied value.
 *
 * Defaults to PUBLIC if the profile row is missing (e.g. the backfill/trigger
 * from migration 0001 hasn't run for this user yet), rather than failing the
 * request.
 */
export async function getUserRole(userId: string): Promise<Role> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.role as Role | undefined) ?? ROLES.PUBLIC;
}
