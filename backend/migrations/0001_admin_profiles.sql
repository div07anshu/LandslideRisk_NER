-- Phase 1 admin foundation: application-level roles.
--
-- There is no migration tooling wired into this repo (the existing schema
-- was created by hand in the Supabase dashboard/SQL editor), so run this
-- file manually in the Supabase SQL editor for this project.
--
-- Adds a `profiles` table that maps a Supabase auth user to an application
-- role. This is the only new table Phase 1 needs — reports/risk data already
-- exist and are read as-is.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'PUBLIC'
    check (role in ('ADMIN', 'FIELD_OFFICER', 'ANALYST', 'PUBLIC')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may read their own role. There is deliberately no insert/update/
-- delete policy for regular users: role changes must go through the
-- service-role key on the backend (see backend/src/services/profileService.ts),
-- never a client-side write, or any user could grant themselves ADMIN.
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Backfill a profile row for every existing user.
insert into public.profiles (id, role)
select id, 'PUBLIC' from auth.users
on conflict (id) do nothing;

-- Auto-create a PUBLIC profile row whenever a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'PUBLIC')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Bootstrap the first admin (run manually, once, with your own account's
-- email). This is the only supported way to create the initial ADMIN user —
-- there is no signup flow or UI toggle for it.
-- ---------------------------------------------------------------------------
-- update public.profiles
-- set role = 'ADMIN', updated_at = now()
-- where id = (select id from auth.users where email = 'you@example.com');
