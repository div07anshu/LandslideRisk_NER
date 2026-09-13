# Landslide Risk — AI Service (FastAPI + Python)

The ML/data microservice at the bottom of the stack. It fetches live weather,
elevation, and slope data, runs the trained landslide-risk model, generates
LLM-powered chat advisory responses, and sends SMS alerts. It is called only
by the Node backend (`../backend`) — it holds no user auth of its own, only
an optional shared-secret check.

## Requirements

- Python 3.10 – 3.12
- The trained model at `app/models/landslide_risk_model.joblib` (produced by
  `../data/scripts/train_model.py` — see `../data/README.md`)

## Setup

```bash
cd ai_services
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash
# source .venv/bin/activate     # Linux/macOS

pip install -r ../requirements.txt
cp .env.example .env
```

### Environment variables

| Variable              | Required | Description                                                          |
| ---------------------- | -------- | ---------------------------------------------------------------------- |
| `GROQ_API_KEY`         | Yes      | Groq API key powering the AI Assistant chat responses                |
| `SUPABASE_URL`         | Yes      | Supabase project URL                                                   |
| `SUPABASE_KEY`         | Yes      | Supabase anon/public key                                              |
| `AI_SERVICE_TOKEN`     | No       | Shared secret checked against `X-Internal-Token` on every request except `/health`. Must match `AI_SERVICE_TOKEN` in `backend/.env`. If unset, the check is skipped (local dev only) |
| `TWILIO_ACCOUNT_SID`   | For SMS  | Twilio account SID, used by `notification_service.py` to send risk alert SMS |
| `TWILIO_AUTH_TOKEN`    | For SMS  | Twilio auth token                                                     |
| `TWILIO_PHONE_NUMBER`  | For SMS  | Twilio sender number (E.164 format)                                  |

> The `twilio` Python package is required for SMS alerts but is not yet
> pinned in the root `requirements.txt` — install it separately
> (`pip install twilio`) if you need `/api/risk/check-and-alert`.

## Running

```bash
cd ai_services
uvicorn app.main:app --port 8000 --reload
```

Health check: `GET http://localhost:8000/health` → `{ "status": "ok", "service": "ai_service" }`
(the only route that skips the `X-Internal-Token` check).

## Project structure

```
ai_services/
├── app/
│   ├── main.py                    # FastAPI app, CORS, router wiring, /health
│   ├── api/routes/
│   │   ├── risk.py                # /api/risk/* endpoints
│   │   └── chat.py                # /api/chat endpoint
│   ├── core/
│   │   └── security.py            # verify_internal_token (X-Internal-Token check)
│   ├── db/
│   │   └── supabase.py            # Supabase client
│   ├── models/
│   │   └── risk_model.py          # Loads landslide_risk_model.joblib
│   └── services/
│       ├── risk_service.py        # Orchestrates weather + elevation/slope + prediction
│       ├── weather_service.py     # Open-Meteo rainfall/humidity/soil-moisture lookups
│       ├── prediction_service.py  # Runs the ML model, classifies risk level
│       ├── location_service.py    # Resolves place names mentioned in chat messages
│       ├── chat_service.py        # Builds Groq LLM prompts/responses for the assistant
│       ├── cache_service.py       # 3-hour file-backed cache for district risk scores
│       └── notification_service.py# Twilio SMS sending
├── cache/
│   └── district_risk_cache.json   # Cache file used by cache_service.py
├── data/
│   └── ner_districts.csv          # District reference data used for lookups
├── fetch_all_districts.py         # Standalone script to warm the district cache
└── .env.example
```

## Risk analysis flow

```
latitude, longitude
      │
      ▼
risk_service.analyze_location()
      │
      ├── weather_service   → rainfall_24h / 48h / 7d, humidity, soil moisture (Open-Meteo)
      ├── elevation + slope → Open-Meteo Elevation API + gradient approximation
      │
      ▼
prediction_service  → runs the joblib model → probability, risk_score, risk_level
```

## Endpoints

All routes below require the `X-Internal-Token` header (see `core/security.py`) when
`AI_SERVICE_TOKEN` is set. `/health` is always public.

| Method | Path                          | Description |
| ------ | ----------------------------- | ------------ |
| GET    | `/health`                     | Service health check (no auth) |
| POST   | `/api/risk/analyze`           | Full risk prediction for a `latitude`/`longitude` |
| POST   | `/api/risk/check-and-alert`   | Runs an analysis and, if `risk_level == "HIGH"`, sends an SMS via Twilio to `phone_number` |
| POST   | `/api/risk/district`          | Risk prediction for a named district (centroid coords), backed by the 3-hour cache |
| GET    | `/api/risk/cache/all`         | All cached district risk scores (used to populate the map instantly) |
| GET    | `/api/risk/cache/stats`       | Cache statistics |
| POST   | `/api/risk/cache/clear-expired`| Manually evict expired cache entries |
| POST   | `/api/chat`                   | LLM-powered advisory chat; resolves a location from the message or prior context, optionally taking admin-configured `risk_thresholds` from the Node backend so the classification matches the rest of the app |

### Example: `/api/risk/analyze`

```bash
curl -X POST http://localhost:8000/api/risk/analyze \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: <AI_SERVICE_TOKEN>" \
  -d '{ "latitude": 30.7333, "longitude": 79.0667 }'
```

Response:

```json
{
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
```

## Automatic SMS alerts

`backend/src/services/alertMonitor.ts` polls active `alert_subscriptions` every
10 minutes and calls `/api/risk/check-and-alert` for each one inside the
Northeast India bounding box. When this service reports `risk_level: "HIGH"`,
it sends the SMS itself via `notification_service.send_trial_alert()` and
returns the Twilio message SID; the backend then records `last_alert_at` and
enforces a 1-hour cooldown per subscription before alerting again. See
`../backend/README.md` for the subscription API.

## Notes

- No user authentication lives here — Supabase Bearer tokens are verified by
  the Node backend before a request ever reaches this service.
- `location_service.py` and `chat_service.py` are what let the AI Assistant
  answer "what's the risk in Shillong?" without the frontend having to
  resolve coordinates itself.
