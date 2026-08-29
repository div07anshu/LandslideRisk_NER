import type { Request, Response } from 'express';
import { HttpError } from '../middleware/errorHandler';

/**
 * GET /api/auth/me — protected. Returns basic, non-sensitive information about
 * the authenticated user. `requireAuth` guarantees `req.user` is set; the
 * guard here is defensive.
 */
export function getMe(req: Request, res: Response): void {
  if (!req.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
}
