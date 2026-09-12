import type { NextFunction, Request, Response } from 'express';
import { getSupabaseAdminClient } from '../config/supabaseClient';
import { RISK_LEVELS, type RiskLevel } from '../constants/riskLevel';

/**
 * GET /api/admin/dashboard/stats — protected (requireAuth + requireAdmin).
 *
 * Returns real counts from the existing `reports`, `profiles`, and
 * `risk_data` tables. Only reflects statuses/levels that actually exist in
 * the schema today — no fabricated categories.
 */
export async function getDashboardStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();

    const [
      totalReports,
      pendingReports,
      investigatingReports,
      resolvedReports,
      registeredUsers,
      riskAnalyses,
      recentReports,
      riskLevels,
    ] = await Promise.all([
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'INVESTIGATING'),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'RESOLVED'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('risk_data').select('*', { count: 'exact', head: true }),
      supabase
        .from('reports')
        .select('id, title, location, status, category, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('risk_data').select('Risk_level'),
    ]);

    for (const result of [
      totalReports,
      pendingReports,
      investigatingReports,
      resolvedReports,
      registeredUsers,
      riskAnalyses,
      recentReports,
      riskLevels,
    ]) {
      if (result.error) {
        throw result.error;
      }
    }

    const riskBreakdown: Record<RiskLevel, number> = {
      LOW: 0,
      MODERATE: 0,
      HIGH: 0,
    };

    for (const row of (riskLevels.data ?? []) as { Risk_level: string | null }[]) {
      const level = String(row.Risk_level ?? '').toUpperCase();
      if ((RISK_LEVELS as readonly string[]).includes(level)) {
        riskBreakdown[level as RiskLevel] += 1;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        reportCounts: {
          total: totalReports.count ?? 0,
          pending: pendingReports.count ?? 0,
          investigating: investigatingReports.count ?? 0,
          resolved: resolvedReports.count ?? 0,
        },
        highRiskLocations: riskBreakdown.HIGH,
        registeredUsers: registeredUsers.count ?? 0,
        riskAnalyses: riskAnalyses.count ?? 0,
        riskBreakdown,
        recentReports: recentReports.data ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
}
