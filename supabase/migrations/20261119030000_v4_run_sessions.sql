-- Allure — migration V4 « séances de course »
-- À coller dans le SQL Editor de Supabase, après la migration V3.
--
-- Rejouable sans perte de données.

create table if not exists public.run_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  session_type text not null default 'easy',
  duration_min integer not null,
  distance_m integer,
  avg_pace_sec integer,
  rpe smallint,
  notes text,
  goal_id uuid references public.goals (id) on delete set null,
  strava_activity_id bigint,
  created_at timestamptz not null default now()
);

alter table public.run_sessions drop constraint if exists run_sessions_session_type_check;
alter table public.run_sessions add constraint run_sessions_session_type_check
  check (session_type in ('easy', 'threshold', 'intervals', 'long', 'race', 'recovery', 'other'));

alter table public.run_sessions drop constraint if exists run_sessions_duration_min_check;
alter table public.run_sessions add constraint run_sessions_duration_min_check
  check (duration_min between 1 and 600);

alter table public.run_sessions drop constraint if exists run_sessions_distance_m_check;
alter table public.run_sessions add constraint run_sessions_distance_m_check
  check (distance_m is null or (distance_m between 0 and 500000));

alter table public.run_sessions drop constraint if exists run_sessions_rpe_check;
alter table public.run_sessions add constraint run_sessions_rpe_check
  check (rpe is null or (rpe between 1 and 5));

create unique index if not exists run_sessions_strava_activity_unique
  on public.run_sessions (strava_activity_id)
  where strava_activity_id is not null;

create index if not exists run_sessions_user_date_idx
  on public.run_sessions (user_id, session_date desc);

-- RLS
alter table public.run_sessions enable row level security;

drop policy if exists "run_sessions_select_own" on public.run_sessions;
create policy "run_sessions_select_own"
  on public.run_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "run_sessions_insert_own" on public.run_sessions;
create policy "run_sessions_insert_own"
  on public.run_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "run_sessions_update_own" on public.run_sessions;
create policy "run_sessions_update_own"
  on public.run_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "run_sessions_delete_own" on public.run_sessions;
create policy "run_sessions_delete_own"
  on public.run_sessions for delete
  using (auth.uid() = user_id);
