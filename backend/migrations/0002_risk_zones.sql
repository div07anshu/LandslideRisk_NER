-- Phase 4A: admin-managed risk zones.
--
-- No existing table represents a named/monitored risk zone. `risk_data`
-- (created by earlier phases' code, no migration on file) holds one row per
-- past risk-analysis run — State/Location/Rainfall/Slope/Elevation/
-- Risk_score/Risk_level — not a zone definition, and it has no coordinates.
-- This is a new, minimal table. Run it manually in the Supabase SQL editor.
--
-- latitude/longitude are nullable and are only ever populated with real
-- coordinates an admin explicitly types in via the admin UI — the backend
-- never generates, defaults, or infers them.

create table if not exists public.risk_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text,
  risk_level text not null check (risk_level in ('LOW', 'MODERATE', 'HIGH')),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  monitoring_enabled boolean not null default true,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint risk_zones_coords_together
    check ((latitude is null) = (longitude is null))
);

alter table public.risk_zones enable row level security;
-- No policies: all reads/writes go through the backend's service-role
-- client behind requireAuth + requireAdmin, never directly from the browser.
