import type { NextFunction, Request, Response } from 'express';
import { getSupabaseAdminClient } from '../config/supabaseClient';
import { HttpError } from '../middleware/errorHandler';
import { ROLES, isRole } from '../constants/roles';
import { positiveInt } from '../utils/pagination';
import { fetchAllAuthUsers } from '../services/authUsersService';
import { recordAuditLog } from '../services/auditLogService';
import { AUDIT_ACTIONS, RESOURCE_TYPES } from '../constants/auditActions';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * GET /api/admin/users — protected (requireAuth + requireAdmin).
 *
 * Lists registered users by merging `profiles.role` with the matching
 * `auth.users` email/timestamps. Only non-sensitive fields are returned —
 * no passwords, tokens, or raw auth metadata.
 */
export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const roleParam = typeof req.query.role === 'string' ? req.query.role.trim() : '';
    const page = positiveInt(req.query.page, 1);
    const pageSize = positiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    if (roleParam && !isRole(roleParam)) {
      throw new HttpError(422, `role must be one of: ${Object.values(ROLES).join(', ')}`);
    }

    const [authUsers, profilesResult] = await Promise.all([
      fetchAllAuthUsers(supabase),
      supabase.from('profiles').select('id, role, created_at'),
    ]);

    if (profilesResult.error) {
      throw profilesResult.error;
    }

    type ProfileRow = { id: string; role: string; created_at: string };

    let users = ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => {
      const authUser = authUsers.get(profile.id);
      return {
        id: profile.id,
        email: authUser?.email ?? null,
        role: profile.role,
        createdAt: authUser?.createdAt ?? profile.created_at,
        lastSignInAt: authUser?.lastSignInAt ?? null,
      };
    });

    if (roleParam) {
      users = users.filter((u) => u.role === roleParam);
    }

    if (search) {
      users = users.filter((u) => (u.email ?? '').toLowerCase().includes(search));
    }

    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = users.length;
    const from = (page - 1) * pageSize;
    const paged = users.slice(from, from + pageSize);

    res.status(200).json({
      success: true,
      data: { users: paged, page, pageSize, total },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:id/role — protected (requireAuth + requireAdmin).
 *
 * Updates only `public.profiles.role` for the target user — never touches
 * Supabase's own auth/Postgres role. The acting admin is always
 * `req.user.id` from requireAuth, never a client-supplied value.
 *
 * Refuses to let an admin change their own role here (self-service role
 * changes don't exist anywhere else in the app either), and refuses to
 * demote the last remaining ADMIN, based on a fresh count read at request
 * time (not a DB constraint — a best-effort check, not a hard guarantee
 * under concurrent requests, which is an acceptable tradeoff at this scale).
 */
export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }

    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const newRole = body.role;

    if (!isRole(newRole)) {
      throw new HttpError(422, `role must be one of: ${Object.values(ROLES).join(', ')}`);
    }

    if (id === req.user.id) {
      throw new HttpError(403, 'You cannot change your own role');
    }

    const { data: targetProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!targetProfile) {
      throw new HttpError(404, 'User not found');
    }

    if (targetProfile.role === ROLES.ADMIN && newRole !== ROLES.ADMIN) {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', ROLES.ADMIN);

      if (countError) {
        throw countError;
      }

      if ((count ?? 0) <= 1) {
        throw new HttpError(409, 'Cannot change role: at least one ADMIN must remain');
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, role, updated_at')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new HttpError(404, 'User not found');
    }

    const auditLogged = await recordAuditLog({
      actorUserId: req.user.id,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
      resourceType: RESOURCE_TYPES.USER,
      resourceId: id,
      metadata: { oldRole: targetProfile.role, newRole },
    });

    res.status(200).json({
      success: true,
      data,
      ...(auditLogged ? {} : { auditWarning: true }),
    });
  } catch (err) {
    next(err);
  }
}
