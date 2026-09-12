import type { NextFunction, Request, Response } from 'express';
import { getSupabaseAdminClient } from '../config/supabaseClient';
import { HttpError } from '../middleware/errorHandler';
import { REPORT_STATUSES, isReportStatus } from '../constants/reportStatus';
import { positiveInt } from '../utils/pagination';
import { escapeForOrFilter } from '../utils/postgrestFilters';
import { recordAuditLog } from '../services/auditLogService';
import { AUDIT_ACTIONS, RESOURCE_TYPES } from '../constants/auditActions';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * GET /api/admin/reports — protected (requireAuth + requireAdmin).
 *
 * Lists reports from the existing `reports` table with search, status, and
 * location filtering plus pagination. No fields beyond what the table
 * already has are used.
 */
export async function listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
    const statusParam = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const page = positiveInt(req.query.page, 1);
    const pageSize = positiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    if (statusParam && !isReportStatus(statusParam)) {
      throw new HttpError(
        422,
        `status must be one of: ${REPORT_STATUSES.join(', ')}`,
      );
    }

    let query = supabase
      .from('reports')
      .select('id, title, location, detail, category, reporter, status, image_url, created_at', {
        count: 'exact',
      });

    if (statusParam) {
      query = query.eq('status', statusParam);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (search) {
      const term = escapeForOrFilter(`%${search}%`);
      query = query.or(
        `title.ilike.${term},location.ilike.${term},detail.ilike.${term},reporter.ilike.${term}`,
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        reports: data ?? [],
        page,
        pageSize,
        total: count ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/reports/:id — protected (requireAuth + requireAdmin).
 *
 * Returns one report plus a best-effort risk_data match (exact, case
 * insensitive, on the free-text location the reporter typed) — the reports
 * table has no lat/lng or state column to join on precisely, so this is a
 * best-effort lookup, not a guaranteed match.
 */
export async function getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (reportError) {
      throw reportError;
    }

    if (!report) {
      throw new HttpError(404, 'Report not found');
    }

    let riskData: unknown = null;

    if (report.location) {
      const { data: riskMatches, error: riskError } = await supabase
        .from('risk_data')
        .select('*')
        .ilike('Location', report.location)
        .order('created_at', { ascending: false })
        .limit(1);

      if (riskError) {
        throw riskError;
      }

      riskData = riskMatches?.[0] ?? null;
    }

    res.status(200).json({
      success: true,
      data: { report, riskData },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/reports/:id/status — protected (requireAuth + requireAdmin).
 *
 * Updates a report's status to one of the statuses that actually exist in
 * the schema today (see constants/reportStatus.ts). Rejects anything else
 * rather than silently accepting an unsupported value.
 */
export async function updateReportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }

    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const status = (req.body ?? {}) as Record<string, unknown>;
    const newStatus = status.status;

    if (!isReportStatus(newStatus)) {
      throw new HttpError(
        422,
        `status must be one of: ${REPORT_STATUSES.join(', ')}`,
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from('reports')
      .select('status')
      .eq('id', id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      throw new HttpError(404, 'Report not found');
    }

    const { data, error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new HttpError(404, 'Report not found');
    }

    const auditLogged = await recordAuditLog({
      actorUserId: req.user.id,
      action: AUDIT_ACTIONS.REPORT_STATUS_CHANGED,
      resourceType: RESOURCE_TYPES.REPORT,
      resourceId: id,
      metadata: { oldStatus: existing.status, newStatus },
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
