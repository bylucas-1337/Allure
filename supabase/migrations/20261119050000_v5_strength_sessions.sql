-- Allure — migration V5 « séances de musculation »
-- À coller dans le SQL Editor de Supabase.
-- Rejouable sans perte de données.

create table if not exists public.strength_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  duration_min integer not null,
  duration_sec smallint,
  rpe smallint,
  notes text,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.strength_sessions drop constraint if exists strength_sessions_duration_min_check;
alter table public.strength_sessions add constraint strength_sessions_duration_min_check
  check (duration_min between 0 and 600);

alter table public.strength_sessions drop constraint if exists strength_sessions_duration_sec_check;
alter table public.strength_sessions add constraint strength_sessions_duration_sec_check
  check (duration_sec is null or (duration_sec between 0 and 59));

alter table public.strength_sessions drop constraint if exists strength_sessions_rpe_check;
alter table public.strength_sessions add constraint strength_sessions_rpe_check
  check (rpe is null or (rpe between 1 and 5));

create index if not exists strength_sessions_user_date_idx
  on public.strength_sessions (user_id, session_date desc);

alter table public.strength_sessions enable row level security;

drop policy if exists "strength_sessions_select_own" on public.strength_sessions;
create policy "strength_sessions_select_own"
  on public.strength_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "strength_sessions_insert_own" on public.strength_sessions;
create policy "strength_sessions_insert_own"
  on public.strength_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "strength_sessions_update_own" on public.strength_sessions;
create policy "strength_sessions_update_own"
  on public.strength_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "strength_sessions_delete_own" on public.strength_sessions;
create policy "strength_sessions_delete_own"
  on public.strength_sessions for delete
  using (auth.uid() = user_id);
