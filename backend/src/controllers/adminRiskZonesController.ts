import type { NextFunction, Request, Response } from 'express';
import { getSupabaseAdminClient } from '../config/supabaseClient';
import { HttpError } from '../middleware/errorHandler';
import { RISK_LEVELS, isRiskLevel } from '../constants/riskLevel';
import { positiveInt } from '../utils/pagination';
import { escapeForOrFilter } from '../utils/postgrestFilters';
import { recordAuditLog } from '../services/auditLogService';
import { AUDIT_ACTIONS, RESOURCE_TYPES } from '../constants/auditActions';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function optionalCoordinate(value: unknown, name: string, min: number, max: number): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new HttpError(422, `${name} must be a number`);
  }
  if (num < min || num > max) {
    throw new HttpError(422, `${name} must be between ${min} and ${max}`);
  }
  return num;
}

/**
 * Latitude/longitude are only ever stored when an admin explicitly types
 * them in — never generated or defaulted. Both must be present together or
 * both absent; a zone with only one coordinate can't be plotted and almost
 * certainly indicates a mistake.
 */
function parseCoordinates(body: Record<string, unknown>): { latitude: number | null; longitude: number | null } {
  const latitude = optionalCoordinate(body.latitude, 'latitude', -90, 90);
  const longitude = optionalCoordinate(body.longitude, 'longitude', -180, 180);

  if ((latitude === null) !== (longitude === null)) {
    throw new HttpError(422, 'latitude and longitude must be provided together');
  }

  return { latitude, longitude };
}

/**
 * GET /api/admin/risk-zones — protected (requireAuth + requireAdmin).
 */
export async function listRiskZones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const riskLevelParam = typeof req.query.riskLevel === 'string' ? req.query.riskLevel.trim() : '';
    const page = positiveInt(req.query.page, 1);
    const pageSize = positiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    if (riskLevelParam && !isRiskLevel(riskLevelParam)) {
      throw new HttpError(422, `riskLevel must be one of: ${RISK_LEVELS.join(', ')}`);
    }

    let query = supabase.from('risk_zones').select('*', { count: 'exact' });

    if (riskLevelParam) {
      query = query.eq('risk_level', riskLevelParam);
    }

    if (search) {
      const term = escapeForOrFilter(`%${search}%`);
      query = query.or(`name.ilike.${term},state.ilike.${term}`);
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
      data: { zones: data ?? [], page, pageSize, total: count ?? 0 },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/risk-zones — protected (requireAuth + requireAdmin).
 */
export async function createRiskZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      throw new HttpError(422, 'name is required');
    }

    if (!isRiskLevel(body.riskLevel)) {
      throw new HttpError(422, `riskLevel must be one of: ${RISK_LEVELS.join(', ')}`);
    }

    const { latitude, longitude } = parseCoordinates(body);
    const state = typeof body.state === 'string' && body.state.trim() ? body.state.trim() : null;
    const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null;
    const monitoringEnabled = body.monitoringEnabled !== false;

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('risk_zones')
      .insert({
        name,
        state,
        risk_level: body.riskLevel,
        latitude,
        longitude,
        monitoring_enabled: monitoringEnabled,
        notes,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const auditLogged = await recordAuditLog({
      actorUserId: req.user.id,
      action: AUDIT_ACTIONS.RISK_ZONE_CREATED,
      resourceType: RESOURCE_TYPES.RISK_ZONE,
      resourceId: data.id,
      metadata: { name, riskLevel: body.riskLevel, hasCoordinates: latitude !== null },
    });

    res.status(201).json({ success: true, data, ...(auditLogged ? {} : { auditWarning: true }) });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/risk-zones/:id — protected (requireAuth + requireAdmin).
 */
export async function updateRiskZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) {
        throw new HttpError(422, 'name cannot be empty');
      }
      update.name = name;
    }

    if (body.riskLevel !== undefined) {
      if (!isRiskLevel(body.riskLevel)) {
        throw new HttpError(422, `riskLevel must be one of: ${RISK_LEVELS.join(', ')}`);
      }
      update.risk_level = body.riskLevel;
    }

    if (body.state !== undefined) {
      update.state = typeof body.state === 'string' && body.state.trim() ? body.state.trim() : null;
    }

    if (body.notes !== undefined) {
      update.notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null;
    }

    if (body.monitoringEnabled !== undefined) {
      update.monitoring_enabled = body.monitoringEnabled === true;
    }

    if (body.latitude !== undefined || body.longitude !== undefined) {
      const { latitude, longitude } = parseCoordinates(body);
      update.latitude = latitude;
      update.longitude = longitude;
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('risk_zones')
      .update(update)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new HttpError(404, 'Risk zone not found');
    }

    const { updated_at: _updatedAt, ...changes } = update;
    const auditLogged = await recordAuditLog({
      actorUserId: req.user.id,
      action: AUDIT_ACTIONS.RISK_ZONE_UPDATED,
      resourceType: RESOURCE_TYPES.RISK_ZONE,
      resourceId: id,
      metadata: { changes },
    });

    res.status(200).json({ success: true, data, ...(auditLogged ? {} : { auditWarning: true }) });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/risk-zones/:id — protected (requireAuth + requireAdmin).
 */
export async function deleteRiskZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('risk_zones')
      .delete()
      .eq('id', id)
      .select('id, name, risk_level')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new HttpError(404, 'Risk zone not found');
    }

    const auditLogged = await recordAuditLog({
      actorUserId: req.user.id,
      action: AUDIT_ACTIONS.RISK_ZONE_DELETED,
      resourceType: RESOURCE_TYPES.RISK_ZONE,
      resourceId: id,
      metadata: { name: data.name, riskLevel: data.risk_level },
    });

    res.status(200).json({ success: true, data: { id }, ...(auditLogged ? {} : { auditWarning: true }) });
  } catch (err) {
    next(err);
  }
}
