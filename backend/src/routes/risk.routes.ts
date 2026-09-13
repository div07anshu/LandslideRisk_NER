import { Router } from 'express';
import { analyze, getRiskData, getLocations, getDistrictDetails } from '../controllers/riskController';
import { requireAuth } from '../middleware/auth';


const router = Router();

// Protected — requires a valid Supabase access token.
router.post('/analyze', requireAuth, analyze);
router.get('/data', requireAuth, getRiskData);
router.get('/locations', requireAuth, getLocations);
router.get('/district-details', requireAuth, getDistrictDetails);

export default router;

