import { getSupabaseAdminClient } from '../config/supabaseClient';
import type { RiskLevel } from '../constants/riskLevel';

export interface RiskThresholds {
  lowMax: number;
  moderateMax: number;
}

/**
 * Matches the AI service's current hardcoded classification exactly
 * (ai_services/app/services/prediction_service.py: score < 35 -> LOW,
 * < 70 -> MODERATE, else HIGH), so behavior is unchanged until an admin
 * explicitly edits `risk_config`.
 */
export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = { lowMax: 35, moderateMax: 70 };

/**
 * Reads the single-row `risk_config` table. Falls back to the defaults
 * above if the table is empty (e.g. migration not yet run) rather than
 * failing the request — risk classification should never hard-fail because
 * configuration is missing.
 */
export async function getRiskThresholds(): Promise<RiskThresholds> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('risk_config')
    .select('low_max, moderate_max')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return DEFAULT_RISK_THRESHOLDS;
  }

  return { lowMax: Number(data.low_max), moderateMax: Number(data.moderate_max) };
}

/**
 * Re-derives a LOW/MODERATE/HIGH label from a 0-100 risk score using the
 * configured thresholds. This is the single place that turns a numeric
 * score into a level for anything the Node backend persists or returns —
 * it does not touch the underlying ML probability/score computation, only
 * the label boundary on top of it.
 */
export function classifyRiskScore(score: number, thresholds: RiskThresholds): RiskLevel {
  if (score < thresholds.lowMax) return 'LOW';
  if (score < thresholds.moderateMax) return 'MODERATE';
  return 'HIGH';
}
