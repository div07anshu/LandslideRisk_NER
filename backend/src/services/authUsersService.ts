import { getSupabaseAdminClient } from '../config/supabaseClient';

// Safety cap on how many pages of Supabase Auth users we'll walk to build
// the in-memory lookup below (20 * 1000 = 20,000 users).
const MAX_AUTH_USER_PAGES = 20;
const AUTH_PAGE_SIZE = 1000;

export interface AuthUserSummary {
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
}

/**
 * Supabase Auth (`auth.users`) is the only place emails/sign-in timestamps
 * live. There is no server-side search or batch-by-id lookup on
 * `admin.listUsers`, so for a project this size we page through all users
 * once per request and merge in memory rather than exposing `auth.users` to
 * the frontend directly. Used by both user management (Phase 3) and audit
 * log actor display (Phase 5).
 */
export async function fetchAllAuthUsers(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
): Promise<Map<string, AuthUserSummary>> {
  const map = new Map<string, AuthUserSummary>();

  for (let page = 1; page <= MAX_AUTH_USER_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: AUTH_PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    for (const user of data.users) {
      map.set(user.id, {
        email: user.email ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
      });
    }

    if (data.users.length < AUTH_PAGE_SIZE) break;
  }

  return map;
}
