import type { AuthenticatedUser } from '../middleware/auth';

/**
 * Makes the authenticated user available on the Express request object after
 * `requireAuth` has run.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
