-- Phase 5: append-only admin audit log.
--
-- No existing table serves this purpose. Run manually in the Supabase SQL
-- editor.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_resource_type_idx on public.audit_logs (resource_type);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);

alter table public.audit_logs enable row level security;
-- No policies at all: no anon/authenticated client (browser) can select,
-- insert, update, or delete a single row here — every read and write goes
-- through the backend's service-role client (see
-- backend/src/services/auditLogService.ts and
-- backend/src/controllers/adminAuditLogsController.ts). The application
-- itself exposes no update/delete path for this table — only inserts
-- (from other admin actions) and a read-only list endpoint — enforcing the
-- append-only design at the application layer since Postgres has no
-- built-in "insert+select only, no update/delete" role for a single client.
