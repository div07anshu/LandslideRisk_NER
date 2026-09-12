/**
 * Application-level roles, stored in `public.profiles.role`.
 * Distinct from the Supabase auth role (`req.user.role`, e.g. "authenticated"),
 * which only reflects Postgres auth state, not app permissions.
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  FIELD_OFFICER: 'FIELD_OFFICER',
  ANALYST: 'ANALYST',
  PUBLIC: 'PUBLIC',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (Object.values(ROLES) as string[]).includes(value);
}
