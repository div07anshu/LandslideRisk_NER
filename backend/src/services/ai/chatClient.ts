import { env } from '../../config';
import { HttpError } from '../../middleware/errorHandler';

const CHAT_PATH = '/api/chat';

export interface ChatLocation {
  state: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface ChatRiskThresholds {
  lowMax: number;
  moderateMax: number;
}

export interface ChatInput {
  message: string;
  language?: string;
  contextLocation?: ChatLocation | null;
  awaitingLocation?: boolean;
  /**
   * The same LOW/MODERATE boundary thresholds riskController.ts uses to
   * classify risk_score (see riskConfigService.ts) — passed through so the
   * chat assistant's own live-location risk classification matches the rest
   * of the app instead of using the AI service's separate hardcoded 35/70.
   */
  riskThresholds?: ChatRiskThresholds | null;
}

export interface ChatResponse {
  response: string;
  locationRequired: boolean;
  resolvedLocation: ChatLocation | null;
}

/**
 * Sends a chat message to the FastAPI AI service and returns the response.
 */
export async function sendChatMessage(input: ChatInput): Promise<ChatResponse> {
  const url = `${env.ai.fastapiUrl.replace(/\/+$/, '')}${CHAT_PATH}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.ai.internalToken ? { 'X-Internal-Token': env.ai.internalToken } : {}),
      },
      body: JSON.stringify({
        message: input.message,
        language: input.language,
        context_location: input.contextLocation ?? null,
        awaiting_location: input.awaitingLocation ?? false,
        risk_thresholds: input.riskThresholds
          ? { low_max: input.riskThresholds.lowMax, moderate_max: input.riskThresholds.moderateMax }
          : null,
      }),
      signal: AbortSignal.timeout(env.ai.fastapiTimeoutMs),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new HttpError(504, 'AI chat service timed out');
    }
    throw new HttpError(502, 'AI chat service is unavailable');
  }

  if (!response.ok) {
    throw new HttpError(502, 'AI chat service failed to respond');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new HttpError(502, 'AI chat service returned a malformed response');
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as Record<string, unknown>).response !== 'string'
  ) {
    throw new HttpError(502, 'AI chat service returned a malformed response');
  }

  const body = payload as Record<string, unknown>;

  return {
    response: body.response as string,
    locationRequired: body.location_required === true,
    resolvedLocation: (body.resolved_location as ChatLocation | null) ?? null,
  };
}
