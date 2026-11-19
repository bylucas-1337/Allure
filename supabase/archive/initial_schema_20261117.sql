-- Allure — schéma de base (Jalon 1)
-- Chaque utilisateur ne peut lire/écrire que ses propres données (RLS).

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('run', 'strength')),
  date timestamptz not null,
  duration_sec integer check (duration_sec is null or duration_sec >= 0),
  source text not null default 'manual' check (source in ('manual', 'fit', 'gpx', 'planned')),
  created_at timestamptz not null default now()
);

create index sessions_user_date_idx on public.sessions (user_id, date desc);

-- Détails d'une séance de course (une ligne par session, NULL pour les séances de musculation).
create table public.run_details (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  distance_m integer check (distance_m is null or distance_m >= 0),
  avg_pace_sec_per_km integer check (avg_pace_sec_per_km is null or avg_pace_sec_per_km >= 0),
  avg_hr integer check (avg_hr is null or avg_hr > 0),
  max_hr integer check (max_hr is null or max_hr > 0),
  elevation_gain_m integer check (elevation_gain_m is null or elevation_gain_m >= 0),
  moving_time_sec integer check (moving_time_sec is null or moving_time_sec >= 0),
  elapsed_time_sec integer check (elapsed_time_sec is null or elapsed_time_sec >= 0),
  pace_zones_json jsonb,
  hr_zones_json jsonb
);

create table public.strength_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  exercise_name text not null check (length(trim(exercise_name)) > 0),
  set_index smallint not null check (set_index > 0),
  repetitions smallint check (repetitions is null or repetitions > 0),
  weight_kg numeric(8, 2) check (weight_kg is null or weight_kg >= 0),
  rpe smallint check (rpe is null or rpe between 1 and 10),
  is_warmup boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, exercise_name, set_index)
);

create index strength_sets_session_idx on public.strength_sets (session_id, set_index);

-- Ressenti après une séance (une ligne par session).
create table public.feelings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  effort_1_10 smallint not null check (effort_1_10 between 1 and 10),
  note_text text,
  created_at timestamptz not null default now()
);

-- Séances planifiées (rempli à partir de V3).
create table public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  sport text not null check (sport in ('run', 'strength')),
  objectives_json jsonb not null default '{}',
  brief_text text,
  rationale_text text,
  status text not null default 'planned' check (status in ('planned', 'done', 'skipped', 'moved')),
  created_at timestamptz not null default now()
);

create index planned_sessions_user_date_idx on public.planned_sessions (user_id, date);

-- Row Level Security : chaque utilisateur ne gère que ses propres données.
alter table public.sessions enable row level security;
alter table public.run_details enable row level security;
alter table public.strength_sets enable row level security;
alter table public.feelings enable row level security;
alter table public.planned_sessions enable row level security;

create policy "Users manage their own sessions"
  on public.sessions for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage details of their own sessions"
  on public.run_details for all
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = run_details.session_id
        and sessions.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = run_details.session_id
        and sessions.user_id = (select auth.uid())
    )
  );

create policy "Users manage sets of their own sessions"
  on public.strength_sets for all
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = strength_sets.session_id
        and sessions.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = strength_sets.session_id
        and sessions.user_id = (select auth.uid())
    )
  );

create policy "Users manage feelings of their own sessions"
  on public.feelings for all
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = feelings.session_id
        and sessions.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = feelings.session_id
        and sessions.user_id = (select auth.uid())
    )
  );

create policy "Users manage their own planned sessions"
  on public.planned_sessions for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.sessions, public.run_details, public.strength_sets,
  public.feelings, public.planned_sessions from anon;

grant select, insert, update, delete on public.sessions, public.run_details,
  public.strength_sets, public.feelings, public.planned_sessions to authenticated;