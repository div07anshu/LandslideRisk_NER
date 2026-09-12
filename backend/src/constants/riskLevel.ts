/**
 * The risk levels used throughout the app (risk_data.Risk_level, risk_zones,
 * dashboard breakdowns). Single source of truth so nothing drifts from it.
 */
export const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH'] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

export function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === 'string' && (RISK_LEVELS as readonly string[]).includes(value);
}
