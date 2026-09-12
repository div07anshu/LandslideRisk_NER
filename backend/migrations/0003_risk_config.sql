-- Phase 4B: configurable risk-level thresholds.
--
-- The actual LOW/MODERATE/HIGH boundaries today are hardcoded in the
-- separate FastAPI AI service:
--   ai_services/app/services/prediction_service.py
--     risk_score < 35  -> LOW
--     risk_score < 70  -> MODERATE
--     else             -> HIGH
-- That service is a standalone microservice, not part of this admin system,
-- and it also backs the AI chat assistant's own internal classification —
-- editing it directly was judged too risky for this phase.
--
-- Instead, the Node backend (which is what actually persists risk_data and
-- serves it to the rest of the app — dashboard, admin, risk analysis) now
-- re-derives risk_level from the AI service's raw risk_score using these
-- configurable thresholds (see backend/src/services/riskConfigService.ts).
-- The defaults below exactly match the AI service's current hardcoded
-- behavior, so applying this migration changes NOTHING until an admin
-- explicitly edits it via /admin/config.
--
-- Single-row table by convention (id is always 1).

create table if not exists public.risk_config (
  id smallint primary key default 1,
  low_max numeric not null default 35 check (low_max > 0 and low_max < 100),
  moderate_max numeric not null default 70 check (moderate_max > 0 and moderate_max <= 100),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint risk_config_single_row check (id = 1),
  constraint risk_config_ordered_thresholds check (low_max < moderate_max)
);

insert into public.risk_config (id, low_max, moderate_max)
values (1, 35, 70)
on conflict (id) do nothing;

alter table public.risk_config enable row level security;
-- No policies: read/write only via the backend's service-role client.
