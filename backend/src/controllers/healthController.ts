import type { Request, Response } from 'express';
import { env } from '../config';

/** GET /api/health — liveness/readiness probe for this backend service. */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    service: 'landslide-risk-backend',
    environment: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
