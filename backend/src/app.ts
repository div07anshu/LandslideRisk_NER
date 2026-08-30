import cors from 'cors';
import express, { type Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { env } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

/**
 * Builds and configures the Express application.
 * Kept separate from `server.ts` so it can be imported in tests without
 * binding to a port.
 */
export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — restricted to the configured origins
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting — applied to the whole API surface
  app.use(
    rateLimit({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // API routes
  app.use('/api', apiRoutes);

  // 404 + centralized error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
