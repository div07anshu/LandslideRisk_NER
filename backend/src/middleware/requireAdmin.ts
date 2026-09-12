import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler';
import { getUserRole } from '../services/profileService';
import { ROLES } from '../constants/roles';

/**
 * Authorization middleware. Must run after `requireAuth`.
 *
 * Re-derives the caller's role from `profiles` on every request via the
 * service-role client — it never trusts a role claim sent by the client.
 * Missing auth -> 401 (defensive; requireAuth should already guarantee this).
 * Authenticated but not ADMIN -> 403.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }

    const role = await getUserRole(req.user.id);

    if (role !== ROLES.ADMIN) {
      throw new HttpError(403, 'Admin access required');
    }

    next();
  } catch (err) {
    next(err);
  }
}
