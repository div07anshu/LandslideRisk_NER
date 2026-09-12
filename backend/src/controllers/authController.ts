import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../middleware/errorHandler';
import { getUserRole } from '../services/profileService';

/**
 * GET /api/auth/me — protected. Returns basic, non-sensitive information about
 * the authenticated user, including their application role (used by the
 * frontend to decide whether to show admin navigation). `requireAuth`
 * guarantees `req.user` is set; the guard here is defensive.
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }

    const role = await getUserRole(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role,
      },
    });
  } catch (err) {
    next(err);
  }
}
