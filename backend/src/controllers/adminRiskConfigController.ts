import type { NextFunction, Request, Response } from 'express';
import { getSupabaseAdminClient } from '../config/supabaseClient';
import { HttpError } from '../middleware/errorHandler';
import { getRiskThresholds } from '../services/riskConfigService';
import { recordAuditLog } from '../services/auditLogService';
import { AUDIT_ACTIONS, RESOURCE_TYPES } from '../constants/auditActions';

/**
 * GET /api/admin/risk-config — protected (requireAuth + requireAdmin).
 *
 * Returns the current LOW/MODERATE boundary thresholds used to classify
 * risk_score into a risk_level (see riskConfigService). Falls back to the
 * defaults that match the AI service's hardcoded behavior if no row has
 * been saved yet.
 */
export async function getRiskConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const thresholds = await getRiskThresholds();
    res.status(200).json({ success: true, data: thresholds });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/risk-config — protected (requireAuth + requireAdmin).
 *
 * Validates and persists new thresholds. Does not touch the AI service or
 * the underlying ML probability/score computation — only the label
 * boundary the Node backend applies on top of it (see riskController.ts).
 */
export async function updateRiskConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const lowMax = Number(body.lowMax);
    const moderateMax = Number(body.moderateMax);

    if (!Number.isFinite(lowMax) || !Number.isFinite(moderateMax)) {
      throw new HttpError(422, 'lowMax and moderateMax must be numbers');
    }

    if (lowMax <= 0 || lowMax >= 100) {
      throw new HttpError(422, 'lowMax must be greater than 0 and less than 100');
    }

    if (moderateMax <= 0 || moderateMax > 100) {
      throw new HttpError(422, 'moderateMax must be greater than 0 and at most 100');
    }

    if (lowMax >= moderateMax) {
      throw new HttpError(422, 'lowMax must be less than moderateMax');
    }

    const oldThresholds = await getRiskThresholds();
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('risk_config')
      .upsert({
        id: 1,
        low_max: lowMax,
        moderate_max: moderateMax,
        updated_by: req.user.id,
        updated_at: new Date().toISOString(),
      })
      .select('low_max, moderate_max, updated_at')
      .single();

    if (error) {
      throw error;
    }

    const auditLogged = await recordAuditLog({
      actorUserId: req.user.id,
      action: AUDIT_ACTIONS.RISK_CONFIG_UPDATED,
      resourceType: RESOURCE_TYPES.RISK_CONFIG,
      resourceId: '1',
      metadata: {
        oldLowMax: oldThresholds.lowMax,
        oldModerateMax: oldThresholds.moderateMax,
        newLowMax: lowMax,
        newModerateMax: moderateMax,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        lowMax: Number(data.low_max),
        moderateMax: Number(data.moderate_max),
        updatedAt: data.updated_at,
      },
      ...(auditLogged ? {} : { auditWarning: true }),
    });
  } catch (err) {
    next(err);
  }
}
