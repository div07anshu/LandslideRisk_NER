/**
 * The report statuses that actually exist in the `reports` table today.
 * Do not add SUBMITTED/UNDER_REVIEW/VERIFIED/REJECTED here without first
 * confirming (and migrating) the database to support them — this list is
 * the single source of truth other status-aware code should import from.
 */
export const REPORT_STATUSES = ['PENDING', 'INVESTIGATING', 'RESOLVED'] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function isReportStatus(value: unknown): value is ReportStatus {
  return (
    typeof value === 'string' &&
    (REPORT_STATUSES as readonly string[]).includes(value)
  );
}
