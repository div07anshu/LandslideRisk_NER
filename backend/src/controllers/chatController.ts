import type { NextFunction, Request, Response } from 'express';
import { sendChatMessage } from '../services/ai';
import { HttpError } from '../middleware/errorHandler';

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

    const result = await sendChatMessage({ message: message.trim() });

    res.status(200).json({
      response: result.response,
    });
  } catch (err) {
    next(err);
  }
}
