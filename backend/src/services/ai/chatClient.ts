import { env } from '../../config';
import { HttpError } from '../../middleware/errorHandler';

const CHAT_PATH = '/api/chat';

export interface ChatInput {
  message: string;
}

export interface ChatResponse {
  response: string;
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.message }),
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

  return payload as ChatResponse;
}
