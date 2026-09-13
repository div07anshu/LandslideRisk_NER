import type { NextFunction, Request, Response } from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getSupabaseAdminClient } from '../config/supabaseClient';
import { RISK_LEVELS, type RiskLevel } from '../constants/riskLevel';
import { env } from '../config';

const DISTRICT_GEOJSON_PATH = path.resolve(
  __dirname,
  '../../../frontend/public/ner_districts_simplified.geojson',
);

/** Every district the Risk Map renders, from the same GeoJSON file it fetches. */
async function getDistrictNames(): Promise<string[]> {
  const raw = await readFile(DISTRICT_GEOJSON_PATH, 'utf-8');
  const geojson = JSON.parse(raw) as { features?: { properties?: { dtname?: string } }[] };
  return (geojson.features ?? [])
    .map((f) => f.properties?.dtname)
    .filter((name): name is string => Boolean(name));
}

/** Cached per-district risk scores from the AI service, keyed by district name. */
async function getCachedDistrictRiskLevels(): Promise<Record<string, string>> {
  const url = `${env.ai.fastapiUrl.replace(/\/+$/, '')}/api/risk/cache/all`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(env.ai.fastapiTimeoutMs) });
    if (!response.ok) return {};

    const cache = (await response.json()) as Record<string, { risk_level?: string }>;
    const levels: Record<string, string> = {};
    for (const [districtName, data] of Object.entries(cache)) {
      if (data?.risk_level) levels[districtName] = String(data.risk_level).toUpperCase();
    }
    return levels;
  } catch {
    // AI service unreachable — fall back to treating every district as unscored.
    return {};
  }
}

/**
 * GET /api/admin/dashboard/stats — protected (requireAuth + requireAdmin).
 *
 * Returns real counts from the existing `reports` and `profiles` tables,
 * plus a risk breakdown over the same district list the Risk Map uses (the
 * shared GeoJSON) classified by the AI service's live/cached score per
 * district, so the total here always matches the map's district count.
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
      districtNames,
      cachedRiskLevels,
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
      getDistrictNames(),
      getCachedDistrictRiskLevels(),
    ]);

    for (const result of [
      totalReports,
      pendingReports,
      investigatingReports,
      resolvedReports,
      registeredUsers,
      riskAnalyses,
      recentReports,
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

    for (const districtName of districtNames) {
      const level = cachedRiskLevels[districtName];
      const bucket = (RISK_LEVELS as readonly string[]).includes(level)
        ? (level as RiskLevel)
        : 'LOW'; // not yet scored — matches the map's default (score 0 = low)
      riskBreakdown[bucket] += 1;
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
