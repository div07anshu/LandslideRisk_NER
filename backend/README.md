# Landslide Risk — Backend (Node.js + Express + TypeScript)

This service sits between the React frontend, Supabase (Auth / Database / Storage),
and the FastAPI AI service (`../ai_services`). It exposes a REST API under `/api`.

**Scope:** Supabase authentication middleware, role-based admin authorization,
a typed proxy to the FastAPI AI risk/chat service, SMS alert subscriptions
with a background monitor, and an admin panel API (dashboard stats, report
moderation, user role management, risk zones, configurable risk thresholds,
read-only audit logs). No ML / weather logic is duplicated here — it is
delegated to FastAPI.

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
| `AI_SERVICE_TOKEN`      | —                        | Shared secret sent as `X-Internal-Token` to the FastAPI service. Optional, but recommended wherever the AI service's network is reachable by more than this backend; must match `AI_SERVICE_TOKEN` in `ai_services/.env` |

The Supabase values are read from the same Supabase project the frontend uses.
Public routes (`/api/health`, `/api/chat`) work without them; protected routes
require at least `SUPABASE_URL` + `SUPABASE_ANON_KEY`, and admin routes also
require the caller's `profiles` row to have the `ADMIN` role.

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
│   ├── server.ts              # Entry point: binds to PORT, starts the alert monitor, graceful shutdown
│   ├── config/                # Env loading, typed config, Supabase client
│   ├── routes/                # Route definitions (mounted under /api)
│   ├── controllers/           # Request handlers
│   ├── services/
│   │   ├── ai/                 # Typed client for the FastAPI AI service (risk + chat)
│   │   ├── alertMonitor.ts     # Background job: polls alert_subscriptions, triggers SMS alerts
│   │   ├── auditLogService.ts  # Writes admin audit_logs entries
│   │   ├── authUsersService.ts # Supabase Auth admin user lookups/updates
│   │   ├── profileService.ts   # Reads a user's role from `profiles`
│   │   └── riskConfigService.ts# Admin-configurable LOW/MODERATE risk thresholds
│   ├── constants/              # Roles, risk levels, report statuses, audit action names
│   ├── middleware/              # Cross-cutting middleware (auth, requireAdmin, error handling)
│   ├── types/                   # Ambient types (Express Request augmentation)
│   └── __tests__/               # Jest + Supertest tests
├── .env.example
├── jest.config.js
├── tsconfig.json
└── package.json
```

## Endpoints

| Method | Path                          | Auth         | Description                        |
| ------ | ------------------------------ | ------------ | --------------------------------- |
| GET    | `/api/health`                 | Public       | Service health check              |
| GET    | `/api/auth/me`                | Bearer token | Basic info about the current user |
| POST   | `/api/auth/alerts/subscribe`  | Bearer token | Save/update the caller's SMS alert subscription (phone + location) |
| GET    | `/api/auth/alerts/check-risk` | Bearer token | On-demand risk check + SMS alert for the caller's saved location |
| POST   | `/api/risk/analyze`           | Bearer token | Landslide risk for a lat/lon (proxied to FastAPI, re-classified against admin thresholds, logged to `risk_data`) |
| GET    | `/api/risk/data`              | Bearer token | Historical `risk_data` rows |
| GET    | `/api/risk/locations`         | Bearer token | State/district/city reference list for the location search filter |
| GET    | `/api/risk/district-details`  | Bearer token | District reference record (population, highways, hospitals) from `Details` |
| POST   | `/api/chat`                   | Public       | Proxies to the FastAPI AI Assistant, passing along admin-configured risk thresholds |
| GET    | `/api/admin/dashboard/stats`  | Admin only   | Aggregate counts for the admin dashboard |
| GET    | `/api/admin/reports`          | Admin only   | List community incident reports |
| GET    | `/api/admin/reports/:id`      | Admin only   | Get one report |
| PATCH  | `/api/admin/reports/:id/status`| Admin only  | Update a report's status |
| GET    | `/api/admin/users`            | Admin only   | List users |
| PATCH  | `/api/admin/users/:id/role`   | Admin only   | Change a user's role |
| GET    | `/api/admin/risk-zones`       | Admin only   | List manually defined risk zones |
| POST   | `/api/admin/risk-zones`       | Admin only   | Create a risk zone |
| PATCH  | `/api/admin/risk-zones/:id`   | Admin only   | Update a risk zone |
| DELETE | `/api/admin/risk-zones/:id`   | Admin only   | Delete a risk zone |
| GET    | `/api/admin/risk-config`      | Admin only   | Get the LOW/MODERATE risk-score thresholds |
| PUT    | `/api/admin/risk-config`      | Admin only   | Update the risk-score thresholds |
| GET    | `/api/admin/audit-logs`       | Admin only   | List audit log entries (read-only — no write route exists) |

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

## SMS alerts

Users subscribe a phone number + location via `POST /api/auth/alerts/subscribe`
(stored in Supabase `alert_subscriptions`). Two ways an alert fires:

1. **On demand** — `GET /api/auth/alerts/check-risk` runs an immediate check
   for the caller's saved location.
2. **Automatic** — `src/services/alertMonitor.ts` starts with the server
   (`server.ts`) and every 10 minutes checks all `is_active` subscriptions
   whose coordinates fall inside the Northeast India bounding box. Each check
   calls the FastAPI `/api/risk/check-and-alert` endpoint, which sends the SMS
   itself via Twilio when `risk_level` comes back `HIGH`. A per-subscription
   1-hour cooldown (`last_alert_at`) prevents repeat alerts for a sustained
   high-risk period.

The actual SMS sending and Twilio credentials live in `ai_services`
(`notification_service.py`) — this backend only decides *who* and *when* to
check, and records cooldown state.

## Admin panel

Every `/api/admin/*` route requires `requireAuth` **and** `requireAdmin`
(`src/middleware/requireAdmin.ts`), which re-derives the caller's role from
the `profiles` table on every request rather than trusting a client-sent
claim — authenticated non-admins get `403`. It covers:

- **Dashboard** — aggregate stats for `AdminDashboard`
- **Reports** — moderate community-submitted incident reports (list / view / update status)
- **Users** — list users and change roles
- **Risk zones** — CRUD for manually defined risk zones shown on the map
- **Risk config** — the LOW/MODERATE score thresholds (`riskConfigService.ts`) used to classify every `/api/risk/analyze` result and passed through to the FastAPI chat endpoint, so risk levels are consistent everywhere without touching the ML model
- **Audit logs** — read-only log of admin actions (`auditLogService.ts` writes these as a side effect of the mutating admin routes above)

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
- `src/__tests__/risk.districtDetails.test.ts` — `/api/risk/district-details`
  validation and lookup behavior.
- `src/__tests__/admin.middleware.test.ts` — `requireAdmin` returns `401` when
  unauthenticated, `403` for a non-admin role, and calls `next()` for `ADMIN`.
- `src/__tests__/admin.reports.test.ts`, `admin.users.test.ts`,
  `admin.riskZones.test.ts`, `admin.riskConfig.test.ts`, `admin.auditLogs.test.ts`
  — each admin resource's list/create/update/delete behavior and auth gating.

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
