import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
import riskRoutes from './risk.routes';
import chatRoutes from './chat.routes';

/**
 * Root API router. All feature routers are mounted here and this is mounted
 * at `/api` by the app. Feature routers (reports, alerts, dashboard, risk…)
 * will be added in later steps.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/risk', riskRoutes);
router.use('/chat', chatRoutes);

export default router;
