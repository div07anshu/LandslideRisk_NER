import { Router } from 'express';
import { getMe } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protected — requires a valid Supabase access token.
router.get('/me', requireAuth, getMe);

export default router;
