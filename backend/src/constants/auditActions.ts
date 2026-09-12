/**
 * Actions recorded to `audit_logs`. Add new entries here as new admin
 * mutations are introduced — never invent an ad-hoc string at a call site.
 */
export const AUDIT_ACTIONS = {
  REPORT_STATUS_CHANGED: 'REPORT_STATUS_CHANGED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  RISK_ZONE_CREATED: 'RISK_ZONE_CREATED',
  RISK_ZONE_UPDATED: 'RISK_ZONE_UPDATED',
  RISK_ZONE_DELETED: 'RISK_ZONE_DELETED',
  RISK_CONFIG_UPDATED: 'RISK_CONFIG_UPDATED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const RESOURCE_TYPES = {
  REPORT: 'report',
  USER: 'user',
  RISK_ZONE: 'risk_zone',
  RISK_CONFIG: 'risk_config',
} as const;

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];
