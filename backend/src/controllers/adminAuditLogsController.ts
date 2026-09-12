import type { NextFunction, Request, Response } from 'express';
import { getSupabaseAdminClient } from '../config/supabaseClient';
import { HttpError } from '../middleware/errorHandler';
import { positiveInt } from '../utils/pagination';
import { fetchAllAuthUsers } from '../services/authUsersService';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parseDateParam(value: unknown, name: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(422, `${name} must be a valid date`);
  }
  return date.toISOString();
}

/**
 * GET /api/admin/audit-logs — protected (requireAuth + requireAdmin).
 *
 * Read-only: there is no update/delete endpoint anywhere in the API for
 * this table — audit_logs is append-only by omission, not by a UI toggle.
 * Enriches each row with the actor's email (for readability) the same way
 * user listing does; no other auth metadata is exposed.
 */
export async function listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();

    const action = typeof req.query.action === 'string' ? req.query.action.trim() : '';
    const resourceType = typeof req.query.resourceType === 'string' ? req.query.resourceType.trim() : '';
    const actorUserId = typeof req.query.actorUserId === 'string' ? req.query.actorUserId.trim() : '';
    const dateFrom = parseDateParam(req.query.dateFrom, 'dateFrom');
    const dateTo = parseDateParam(req.query.dateTo, 'dateTo');
    const page = positiveInt(req.query.page, 1);
    const pageSize = positiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    let query = supabase.from('audit_logs').select('*', { count: 'exact' });

    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (actorUserId) query = query.eq('actor_user_id', actorUserId);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    type LogRow = {
      id: string;
      actor_user_id: string | null;
      action: string;
      resource_type: string;
      resource_id: string | null;
      metadata: unknown;
      created_at: string;
    };

    const rows = (data ?? []) as LogRow[];
    const actorIds = Array.from(new Set(rows.map((r) => r.actor_user_id).filter((v): v is string => Boolean(v))));

    const authUsers = actorIds.length > 0 ? await fetchAllAuthUsers(supabase) : new Map();

    const logs = rows.map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      actorEmail: row.actor_user_id ? authUsers.get(row.actor_user_id)?.email ?? null : null,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));

    res.status(200).json({
      success: true,
      data: { logs, page, pageSize, total: count ?? 0 },
    });
  } catch (err) {
    next(err);
  }
}
