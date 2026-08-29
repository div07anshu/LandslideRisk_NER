import { Router } from 'express';
import { analyze,getRiskData } from '../controllers/riskController';
import { requireAuth } from '../middleware/auth';


const router = Router();

// Protected — requires a valid Supabase access token.
router.post('/analyze', requireAuth, analyze);
router.get('/data', requireAuth, getRiskData);

export default router;

