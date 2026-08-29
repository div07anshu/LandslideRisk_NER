import type { NextFunction, Request, Response } from 'express';
import { getSupabaseClient } from '../config';
import { HttpError } from './errorHandler';

/**
 * The subset of the Supabase user that we attach to the request and are
 * willing to expose. Deliberately minimal — no tokens, no raw metadata.
 */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: string | null;
}

const BEARER_RE = /^Bearer +(.+)$/i;

/**
 * Authentication middleware.
 *
 * Expects `Authorization: Bearer <supabase_access_token>`.
 * - Missing / malformed header  -> 401
 * - Invalid / expired token     -> 401
 * The token is verified by calling Supabase (`auth.getUser`) — it is never
 * decoded-and-trusted locally. On success `req.user` is populated.
 *
 * Security: the access token is never logged.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const match = typeof header === 'string' ? header.match(BEARER_RE) : null;
    const token = match?.[1]?.trim();

    if (!token) {
      throw new HttpError(401, 'Missing or malformed Authorization header');
    }

    const { data, error } = await getSupabaseClient().auth.getUser(token);

    if (error || !data?.user) {
      throw new HttpError(401, 'Invalid or expired access token');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      role: data.user.role ?? null,
    };

    next();
  } catch (err) {
    next(err);
  }
}
