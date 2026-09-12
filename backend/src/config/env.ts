import dotenv from 'dotenv';

dotenv.config();

/**
 * Small helpers to read environment variables with sane fallbacks.
 * Nothing here is required yet — later steps (Supabase, FastAPI) will add
 * their own required checks.
 */
function str(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
}

function int(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const env = {
  nodeEnv: str('NODE_ENV', 'development'),
  port: int('PORT', 4000),

  /** Origins allowed by CORS. Supports a comma-separated list. */
  corsOrigins: str('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  rateLimit: {
    windowMs: int('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: int('RATE_LIMIT_MAX', 100),
  },

  supabase: {
    url: str('SUPABASE_URL', ''),
    anonKey: str('SUPABASE_ANON_KEY', ''),
    /** Server-only admin secret. Never send to the client, never log. */
    serviceRoleKey: str('SUPABASE_SERVICE_ROLE_KEY', ''),
  },

  ai: {
    /** Base URL of the existing FastAPI risk/prediction service. */
    fastapiUrl: str('FASTAPI_URL', 'http://localhost:8000'),
    /** Request timeout (ms) for calls to the FastAPI service. */
    fastapiTimeoutMs: int('FASTAPI_TIMEOUT_MS', 15_000),
    /**
     * Shared secret sent as `X-Internal-Token` on every call to the FastAPI
     * service, so it can refuse requests that didn't come from this backend.
     * Optional: if unset, no header is sent and the FastAPI service (if it
     * also has no token configured) accepts unauthenticated calls — set this
     * in any environment where the AI service's network is reachable by
     * anything other than this backend.
     */
    internalToken: str('AI_SERVICE_TOKEN', ''),
  },
} as const;

export const isProduction = env.nodeEnv === 'production';
