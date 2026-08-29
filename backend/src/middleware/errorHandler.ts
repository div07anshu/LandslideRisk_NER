import type { NextFunction, Request, Response } from 'express';
import { isProduction } from '../config';

/**
 * Application error with an attached HTTP status code. Throw this (or call
 * `next(new HttpError(...))`) anywhere in a route/controller to produce a
 * structured error response.
 */
export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

/** Catch-all for unmatched routes. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/** Centralized error handler. Must be registered last, after all routes. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const status = err instanceof HttpError ? err.status : 500;
  const message =
    err instanceof Error ? err.message : 'Internal Server Error';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: {
      status,
      message,
      ...(err instanceof HttpError && err.details !== undefined
        ? { details: err.details }
        : {}),
      ...(isProduction || !(err instanceof Error) || !err.stack
        ? {}
        : { stack: err.stack }),
    },
  });
}
