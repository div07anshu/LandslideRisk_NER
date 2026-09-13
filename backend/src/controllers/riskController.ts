import type { NextFunction, Request, Response } from 'express';
import { analyzeRisk } from '../services/ai';
import { HttpError } from '../middleware/errorHandler';
import { getSupabaseAdminClient } from '../config/supabaseClient';
import { getRiskThresholds, classifyRiskScore } from '../services/riskConfigService';

function coordinate(
  value: unknown,
  name: string,
  min: number,
  max: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new HttpError(400, `${name} must be a number`);
  }
  if (value < min || value > max) {
    throw new HttpError(400, `${name} must be between ${min} and ${max}`);
  }
  return value;
}

/**
 * POST /api/risk/analyze — protected.
 * Validates the coordinates, forwards them to the FastAPI AI service, and
 * returns the prediction unchanged.
 */
export async function analyze(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const latitude = coordinate(body.latitude, 'latitude', -90, 90);
    const longitude = coordinate(body.longitude, 'longitude', -180, 180);
    const location = String(body.location ?? '');
    const state = String(body.state ?? '');

    const prediction = await analyzeRisk({ latitude, longitude ,location,
  state,});

    // Re-derive risk_level from the raw score using the admin-configurable
    // thresholds (see riskConfigService) instead of trusting the AI
    // service's own hardcoded classification — this is what makes risk
    // thresholds configurable without touching the ML model itself.
    const thresholds = await getRiskThresholds();
    const riskLevel = classifyRiskScore(prediction.risk_score, thresholds);
    const result = { ...prediction, risk_level: riskLevel };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
      .from('risk_data')
      .insert({
        State: state,
        Location: location,
        Rainfall: prediction.features.rainfall_24h,
        Slope: prediction.features.slope,
        Elevation: prediction.features.elevation,
        Historical_landslide: null,
        Risk_score: prediction.risk_score,
        Risk_level: riskLevel,
      });

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }

}
export async function getRiskData(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('risk_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/risk/district-details — protected.
 * Looks up the district reference record (population, highways, government
 * schools/hospitals) from the `Details` table so the Risk Map's location
 * panel can show it alongside the live risk score.
 */
export async function getDistrictDetails(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const district = String(req.query.district ?? '').trim();
    if (!district) {
      throw new HttpError(400, 'district is required');
    }

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from('Details')
      .select('*')
      .ilike('District', district);

    const state = String(req.query.state ?? '').trim();
    if (state) {
      query = query.ilike('State', state);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: data ?? null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/risk/locations — protected.
 * Returns the state/district/city reference list used to populate the
 * location search filter.
 */
export async function getLocations(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('location')
      .select('id, State, District, City, Latitude, Longitude')
      .order('State', { ascending: true })
      .order('District', { ascending: true })
      .order('City', { ascending: true });

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}