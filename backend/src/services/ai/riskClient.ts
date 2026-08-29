import { env } from '../../config';
import { HttpError } from '../../middleware/errorHandler';
import type {
  RiskAnalysisInput,
  RiskAnalysisResult,
  RiskFeatures,
  RiskLevel,
} from './types';

const RISK_ANALYZE_PATH = '/api/risk/analyze';
const RISK_LEVELS: readonly RiskLevel[] = ['LOW', 'MODERATE', 'HIGH'];
const FEATURE_KEYS: readonly (keyof RiskFeatures)[] = [
  'rainfall_24h',
  'rainfall_48h',
  'rainfall_7d',
  'average_humidity_24h',
  'soil_moisture',
  'elevation',
  'slope',
];

/** Bad-gateway: the upstream AI service misbehaved (not the client's fault). */
function upstreamError(): HttpError {
  return new HttpError(502, 'AI service failed to produce a prediction');
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Validates the raw upstream payload matches the documented FastAPI contract. */
function parseResult(payload: unknown): RiskAnalysisResult {
  if (typeof payload !== 'object' || payload === null) {
    throw new HttpError(502, 'AI service returned a malformed response');
  }

  const body = payload as Record<string, unknown>;
  const features = body.features as Record<string, unknown> | undefined;

  const valid =
    isFiniteNumber(body.probability) &&
    isFiniteNumber(body.risk_score) &&
    typeof body.risk_level === 'string' &&
    RISK_LEVELS.includes(body.risk_level as RiskLevel) &&
    typeof features === 'object' &&
    features !== null &&
    FEATURE_KEYS.every((key) => isFiniteNumber(features[key]));

  if (!valid) {
    throw new HttpError(502, 'AI service returned a malformed response');
  }

  return payload as RiskAnalysisResult;
}

/**
 * Sends a latitude/longitude pair to the FastAPI risk service and returns the
 * prediction.
 *
 * All upstream problems (timeout, connection refused, HTTP 4xx/5xx, malformed
 * body) are translated into generic `HttpError`s here so that no internal
 * FastAPI error text, status, or stack trace ever reaches the client.
 */
export async function analyzeRisk(
  input: RiskAnalysisInput,
): Promise<RiskAnalysisResult> {
  const url = `${env.ai.fastapiUrl.replace(/\/+$/, '')}${RISK_ANALYZE_PATH}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: input.latitude,
        longitude: input.longitude,
      }),
      signal: AbortSignal.timeout(env.ai.fastapiTimeoutMs),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new HttpError(504, 'AI service timed out');
    }
    // Node's fetch throws a TypeError ("fetch failed") on DNS / connection errors.
    throw new HttpError(502, 'AI service is unavailable');
  }

  if (!response.ok) {
    // 422 (validation) should not happen — this layer already validated the
    // coordinates — so an upstream 422 means a contract mismatch, not client
    // error. Everything non-2xx collapses to a single opaque bad-gateway.
    throw upstreamError();
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new HttpError(502, 'AI service returned a malformed response');
  }

  return parseResult(payload);
}
