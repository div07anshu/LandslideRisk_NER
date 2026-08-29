# Landslide Risk — Backend (Node.js + Express + TypeScript)

This service sits between the React frontend, Supabase (Auth / Database / Storage),
and the existing FastAPI AI service. It exposes a REST API under `/api`.

> **Scope so far:** project scaffold (security middleware, health check,
> centralized error handling), **Supabase authentication middleware**, and a
> **thin proxy to the FastAPI AI risk service**. No feature APIs
> (reports / alerts / dashboard) are implemented yet. No ML / weather logic is
> duplicated here — it is delegated to FastAPI.

## Requirements

- Node.js 20+ (developed on Node 22)
- npm 10+

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` as needed. `.env` is git-ignored; `.env.example` is the tracked template.

### Environment variables

| Variable                | Default                  | Description                                        |
| ----------------------- | ------------------------ | ------------------------------------------------- |
| `NODE_ENV`              | `development`            | `development` \| `production` \| `test`           |
| `PORT`                  | `4000`                   | Port the Express server listens on               |
| `CORS_ORIGIN`           | `http://localhost:5173`  | Allowed origin(s), comma-separated                |
| `RATE_LIMIT_WINDOW_MS`  | `900000`                 | Rate-limit window in ms (15 min)                  |
| `RATE_LIMIT_MAX`        | `100`                    | Max requests per IP per window                    |
| `SUPABASE_URL`          | —                        | Supabase project URL (Project Settings → API)    |
| `SUPABASE_ANON_KEY`     | —                        | Supabase anon/public key — used to verify tokens |
| `SUPABASE_SERVICE_ROLE_KEY` | —                    | **Server-only secret.** Never expose to the frontend, never log |
| `FASTAPI_URL`           | `http://localhost:8000`  | Base URL of the existing FastAPI AI service       |
| `FASTAPI_TIMEOUT_MS`    | `15000`                  | Timeout (ms) for calls to the FastAPI service     |

The Supabase values are read from the same Supabase project the frontend uses.
Public routes (`/api/health`) work without them; protected routes require at
least `SUPABASE_URL` + `SUPABASE_ANON_KEY`.

## Running

```bash
# Development — auto-reload on file changes
npm run dev

# Production
npm run build
npm start

# Type-check only (no emit)
npm run typecheck

# Run the test suite (Jest + Supertest)
npm test
```

## Project structure

```
backend/
├── src/
│   ├── app.ts                 # Express app: middleware + route wiring
│   ├── server.ts              # Entry point: binds to PORT, graceful shutdown
│   ├── config/                # Env loading, typed config, Supabase client
│   ├── routes/                # Route definitions (mounted under /api)
│   ├── controllers/           # Request handlers
│   ├── services/
│   │   └── ai/                # Typed client for the FastAPI AI service
│   ├── middleware/            # Cross-cutting middleware (auth, error handling)
│   ├── types/                 # Ambient types (Express Request augmentation)
│   └── __tests__/             # Jest + Supertest tests
├── .env.example
├── jest.config.js
├── tsconfig.json
└── package.json
```

## Endpoints

| Method | Path                 | Auth         | Description                        |
| ------ | -------------------- | ------------ | --------------------------------- |
| GET    | `/api/health`        | Public       | Service health check              |
| GET    | `/api/auth/me`       | Bearer token | Basic info about the current user |
| POST   | `/api/risk/analyze`  | Bearer token | Landslide risk for a lat/lon (proxied to FastAPI) |

```bash
curl http://localhost:4000/api/health

# Protected — pass the Supabase access token from the frontend session
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <supabase_access_token>"
```

`GET /api/auth/me` response:

```json
{ "success": true, "user": { "id": "…", "email": "…" } }
```

### POST `/api/risk/analyze`

Request:

```bash
curl -X POST http://localhost:4000/api/risk/analyze \
  -H "Authorization: Bearer <supabase_access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "latitude": 30.7333, "longitude": 79.0667 }'
```

| Field       | Type   | Constraint       |
| ----------- | ------ | ---------------- |
| `latitude`  | number | `-90` … `90`     |
| `longitude` | number | `-180` … `180`   |

Success (`200`) — the FastAPI prediction, unchanged, under `data`:

```json
{
  "success": true,
  "data": {
    "probability": 0.1234,
    "risk_score": 12.34,
    "risk_level": "LOW",
    "features": {
      "rainfall_24h": 5.2,
      "rainfall_48h": 11.0,
      "rainfall_7d": 40.6,
      "average_humidity_24h": 82.5,
      "soil_moisture": 0.312,
      "elevation": 1345.0,
      "slope": 18.44
    }
  }
}
```

Error responses (generic — no upstream detail or stack traces leak):

| Status | Cause                                                        |
| ------ | ----------------------------------------------------------- |
| `401`  | Missing / invalid Supabase token                            |
| `400`  | `latitude` / `longitude` missing, non-numeric, or out of range |
| `502`  | FastAPI returned a non-2xx (incl. its own 422/500) or a malformed body, or the service is unreachable |
| `504`  | FastAPI did not respond within `FASTAPI_TIMEOUT_MS`         |

## Node → FastAPI flow

```
React
  → POST /api/risk/analyze  (Authorization: Bearer <supabase token>)
      → requireAuth            verifies the token with Supabase
      → riskController.analyze validates latitude / longitude
      → services/ai/analyzeRisk  POST ${FASTAPI_URL}/api/risk/analyze
          → FastAPI            fetches weather / elevation / slope, runs the model
      ← prediction JSON        shape-checked against the documented contract
  ← { success: true, data: <prediction> }
```

- `src/services/ai/` — the only place that knows FastAPI exists.
  `analyzeRisk({ latitude, longitude })` is fully typed (`RiskAnalysisResult`),
  uses `fetch` with an `AbortSignal.timeout`, and converts every upstream
  failure into a generic `HttpError` (`502` / `504`). No weather, elevation,
  slope, or ML logic is reimplemented here.

## Authentication

Flow: **React → Supabase Auth → access token → `Authorization: Bearer <token>`
→ `requireAuth` middleware → Supabase verifies the token → `req.user`**.

- `src/config/supabaseClient.ts` — lazy singleton Supabase clients.
  `getSupabaseClient()` (anon key) verifies tokens; `getSupabaseAdminClient()`
  (service-role key) is available for future privileged operations.
- `src/middleware/auth.ts` — `requireAuth`:
  - reads the `Authorization` header, expects `Bearer <token>`
  - `401` if the header is missing or malformed
  - verifies the token via `supabase.auth.getUser(token)` — the JWT is **not**
    decoded-and-trusted locally
  - `401` if Supabase rejects the token (invalid / expired)
  - on success attaches a minimal `req.user` (`id`, `email`, `role`)
- Errors go through the existing `HttpError` / `errorHandler` pipeline.
- Access tokens and secrets are never logged; `req.user` exposes no sensitive
  fields.

Apply to any future route with:

```ts
router.get('/protected', requireAuth, handler);
```

## Middleware

- **Helmet** — secure HTTP response headers
- **CORS** — restricted to `CORS_ORIGIN`
- **express-rate-limit** — per-IP request throttling across `/api`
- **`requireAuth`** — Supabase Bearer-token authentication (see above)
- **Centralized error handling** — all errors funnel through
  `src/middleware/errorHandler.ts`; unmatched routes return a structured `404`.
  Throw `new HttpError(status, message, details?)` from anywhere to control the
  response. Stack traces are included only outside production.

## Tests

`npm test` runs Jest + Supertest against the in-process app (Supabase is
mocked — no real project or credentials needed):

- `src/__tests__/health.test.ts` — `/api/health` stays public and returns `200`
- `src/__tests__/auth.middleware.test.ts` — missing header, malformed header,
  and invalid token each return `401`; a valid token returns `200` with only
  `id` + `email`.
- `src/__tests__/risk.analyze.test.ts` — `global.fetch` is mocked (FastAPI is
  never contacted): missing auth → `401`, bad coordinates → `400`, a good
  response → `200`, FastAPI `500`/`422` → `502`, timeout → `504`, connection
  refused → `502`, malformed body → `502`.

## Running Node + FastAPI together

```bash
# Terminal 1 — FastAPI AI service (must run from ai_services/)
cd ai_services
python3 -m venv .venv && source .venv/bin/activate
pip install -r ../requirements.txt
uvicorn app.main:app --port 8000

# Terminal 2 — Node backend
cd backend
npm install
cp .env.example .env      # then fill in SUPABASE_* ; FASTAPI_URL already defaults to :8000
npm run dev
```
