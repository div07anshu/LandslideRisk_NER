import type { NextFunction, Request, Response } from 'express';
import { analyzeRisk } from '../services/ai';
import { HttpError } from '../middleware/errorHandler';
import { getSupabaseAdminClient } from '../config/supabaseClient';

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
        Risk_level: prediction.risk_level,
      });

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: prediction,
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