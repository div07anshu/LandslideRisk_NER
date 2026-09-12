import { getSupabaseAdminClient } from '../config/supabaseClient';
import type { AuditAction, ResourceType } from '../constants/auditActions';

export interface AuditLogInput {
  /** Always `req.user.id` from requireAuth — never a client-supplied value. */
  actorUserId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string | null;
  /**
   * Free-form context (e.g. { oldStatus, newStatus }). Never include
   * passwords, tokens, service-role keys, or other auth secrets here.
   */
  metadata?: Record<string, unknown> | null;
}

/**
 * Writes one audit_logs row. Deliberately never throws: a failed audit
 * write must not cause an already-successful admin action to be reported
 * as failed to the caller (which would invite a confusing retry of a
 * mutation that already applied — e.g. double-changing a role or hitting
 * the last-admin guard unexpectedly). Failures are logged server-side via
 * console.error with enough context to reconcile manually; the boolean
 * return lets the caller attach a non-blocking `auditWarning` to its
 * response instead of hiding the gap.
 *
 * This is NOT a database transaction — the business mutation and this
 * insert are two separate statements against the same Postgres instance,
 * not one atomic unit. A true all-or-nothing guarantee would require moving
 * each mutation into a Postgres function invoked via `supabase.rpc(...)`,
 * which was judged out of scope for six different action types in this
 * phase; this is the stated, accepted limitation.
 */
export async function recordAuditLog(entry: AuditLogInput): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase.from('audit_logs').insert({
      actor_user_id: entry.actorUserId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      metadata: entry.metadata ?? null,
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    console.error(
      'Failed to write audit log entry:',
      entry.action,
      entry.resourceType,
      entry.resourceId,
      err,
    );
    return false;
  }
}
