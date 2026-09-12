import type { NextFunction, Request, Response } from 'express';
import { sendChatMessage, type ChatLocation } from '../services/ai';
import { HttpError } from '../middleware/errorHandler';
import { getRiskThresholds } from '../services/riskConfigService';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Validates and narrows an arbitrary payload into a `ChatLocation`, or null. */
function parseContextLocation(value: unknown): ChatLocation | null {
  if (typeof value !== 'object' || value === null) return null;

  const loc = value as Record<string, unknown>;
  const valid =
    typeof loc.state === 'string' &&
    typeof loc.district === 'string' &&
    typeof loc.city === 'string' &&
    isFiniteNumber(loc.latitude) &&
    isFiniteNumber(loc.longitude);

  if (!valid) return null;

  return {
    state: loc.state as string,
    district: loc.district as string,
    city: loc.city as string,
    latitude: loc.latitude as number,
    longitude: loc.longitude as number,
  };
}

/**
 * POST /api/chat — proxies the user's message to the FastAPI AI chat service.
 */
export async function chat(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const message = body.message;

    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new HttpError(400, 'message must be a non-empty string');
    }

    const language = typeof body.language === 'string' ? body.language : undefined;
    const contextLocation = parseContextLocation(body.context_location);
    const awaitingLocation = body.awaiting_location === true;
    const riskThresholds = await getRiskThresholds();

    const result = await sendChatMessage({
      message: message.trim(),
      language,
      contextLocation,
      awaitingLocation,
      riskThresholds,
    });

    res.status(200).json({
      response: result.response,
      location_required: result.locationRequired,
      resolved_location: result.resolvedLocation,
    });
  } catch (err) {
    next(err);
  }
}
