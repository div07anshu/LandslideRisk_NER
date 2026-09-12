import { Router } from 'express';
import { getMe } from '../controllers/authController';
import {
    subscribeToAlerts,
    checkMyRisk,
} from '../controllers/alertController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protected — requires a valid Supabase access token.
router.get('/me', requireAuth, getMe);

// Protected — save/update the current user's SMS alert subscription.
router.post('/alerts/subscribe', requireAuth, subscribeToAlerts);

// Protected — check risk at the current user's saved location.
router.get('/alerts/check-risk', requireAuth, checkMyRisk);

export default router;