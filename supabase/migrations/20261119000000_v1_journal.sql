-- Allure — schéma V1 « journal »
-- À coller dans le SQL Editor de Supabase.
--
-- La base est vide : ce fichier crée tout le schéma V1.
-- Il est aussi rejouable sans supprimer de données (create if not exists,
-- add column if not exists, drop policy if exists avant recréation).

-- ---------------------------------------------------------------------------
-- 0. Fonction commune pour updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Profil
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  birth_date date,
  height_cm numeric(5, 1) check (height_cm is null or height_cm between 50 and 250),
  sex text check (sex is null or sex in ('female', 'male', 'other', 'prefer_not_to_say')),
  experience_level text check (
    experience_level is null
    or experience_level in ('beginner', 'intermediate', 'advanced')
  ),
  weekly_availability jsonb not null default '{}'::jsonb,
  timezone text not null default 'Europe/Paris',
  calendar_token uuid not null default gen_random_uuid(),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists height_cm numeric(5, 1);
alter table public.profiles add column if not exists sex text;
alter table public.profiles add column if not exists experience_level text;
alter table public.profiles add column if not exists weekly_availability jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists timezone text not null default 'Europe/Paris';
alter table public.profiles add column if not exists calendar_token uuid not null default gen_random_uuid();
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_calendar_token_key
  on public.profiles (calendar_token);

-- ---------------------------------------------------------------------------
-- 2. Poids (historique daté)
-- ---------------------------------------------------------------------------
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric(5, 2) not null check (weight_kg between 20 and 400),
  note_text text,
  created_at timestamptz not null default now()
);

create unique index if not exists weight_entries_user_day_key
  on public.weight_entries (user_id, measured_on);

create index if not exists weight_entries_user_date_idx
  on public.weight_entries (user_id, measured_on desc);

-- ---------------------------------------------------------------------------
-- 3. Blessures et douleurs
-- ---------------------------------------------------------------------------
create table if not exists public.injuries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null check (length(trim(label)) > 0),
  body_area text,
  status text not null default 'active' check (status in ('active', 'recovering', 'recovered')),
  started_on date,
  ended_on date,
  note_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_on is null or started_on is null or ended_on >= started_on)
);

create index if not exists injuries_user_status_idx
  on public.injuries (user_id, status);

-- ---------------------------------------------------------------------------
-- 4. Objectif de course
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sport text not null default 'run' check (sport in ('run')),
  race_name text,
  distance_m integer not null check (distance_m > 0),
  race_date date not null,
  target_time_sec integer check (target_time_sec is null or target_time_sec > 0),
  status text not null default 'active' check (status in ('active', 'achieved', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_status_idx
  on public.goals (user_id, status);

-- Un seul objectif actif par sport : évite les objectifs contradictoires.
create unique index if not exists goals_one_active_per_sport
  on public.goals (user_id, sport)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- 5. Exercices (catalogue global + exercices personnels)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  muscle_group text,
  equipment text,
  is_compound boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catalogue : user_id null. Unicité insensible à la casse.
create unique index if not exists exercises_catalog_name_key
  on public.exercises (lower(name))
  where user_id is null;

create unique index if not exists exercises_user_name_key
  on public.exercises (user_id, lower(name))
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- 6. Séances réalisées
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('run', 'strength')),
  date timestamptz not null,
  duration_sec integer check (duration_sec is null or duration_sec >= 0),
  source text not null default 'manual' check (source in ('manual', 'fit', 'gpx', 'planned')),
  title text,
  session_type text,
  notes_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sessions add column if not exists title text;
alter table public.sessions add column if not exists session_type text;
alter table public.sessions add column if not exists notes_text text;
alter table public.sessions add column if not exists updated_at timestamptz not null default now();

create index if not exists sessions_user_date_idx
  on public.sessions (user_id, date desc);

-- ---------------------------------------------------------------------------
-- 7. Détails course
-- ---------------------------------------------------------------------------
create table if not exists public.run_details (
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
  hr_zones_json jsonb,
  updated_at timestamptz not null default now()
);

alter table public.run_details add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 8. Séries de musculation
-- ---------------------------------------------------------------------------
create table if not exists public.strength_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  exercise_name text not null check (length(trim(exercise_name)) > 0),
  set_index smallint not null check (set_index > 0),
  repetitions smallint check (repetitions is null or repetitions > 0),
  weight_kg numeric(8, 2) check (weight_kg is null or weight_kg >= 0),
  rpe smallint check (rpe is null or rpe between 1 and 10),
  rir smallint check (rir is null or rir between 0 and 10),
  is_warmup boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.strength_sets add column if not exists exercise_id uuid references public.exercises (id) on delete set null;
alter table public.strength_sets add column if not exists rir smallint;
alter table public.strength_sets add column if not exists updated_at timestamptz not null default now();

alter table public.strength_sets drop constraint if exists strength_sets_rir_check;
alter table public.strength_sets add constraint strength_sets_rir_check
  check (rir is null or rir between 0 and 10);

create index if not exists strength_sets_exercise_idx
  on public.strength_sets (exercise_id);

-- Unicité des séries : par exercice identifié, ou par nom pour les anciennes
-- lignes sans exercise_id. Les deux index partiels évitent les doublons.
create unique index if not exists strength_sets_session_exercise_set_key
  on public.strength_sets (session_id, exercise_id, set_index)
  where exercise_id is not null;

create unique index if not exists strength_sets_session_name_set_key
  on public.strength_sets (session_id, exercise_name, set_index)
  where exercise_id is null;

-- ---------------------------------------------------------------------------
-- 9. Ressenti après séance
-- ---------------------------------------------------------------------------
create table if not exists public.feelings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  effort_1_10 smallint not null check (effort_1_10 between 1 and 10),
  note_text text,
  pain_level smallint check (pain_level is null or pain_level between 0 and 10),
  pain_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feelings add column if not exists pain_level smallint;
alter table public.feelings add column if not exists pain_note text;
alter table public.feelings add column if not exists updated_at timestamptz not null default now();

alter table public.feelings drop constraint if exists feelings_pain_level_check;
alter table public.feelings add constraint feelings_pain_level_check
  check (pain_level is null or pain_level between 0 and 10);

-- ---------------------------------------------------------------------------
-- 10. Séances planifiées (V1 : saisie manuelle ; moteur à partir de V3)
-- ---------------------------------------------------------------------------
create table if not exists public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  sport text not null check (sport in ('run', 'strength')),
  session_type text,
  duration_min integer check (duration_min is null or duration_min > 0),
  objectives_json jsonb not null default '{}'::jsonb,
  details_json jsonb not null default '{}'::jsonb,
  brief_text text,
  rationale_text text,
  origin text not null default 'manual' check (origin in ('manual', 'engine')),
  status text not null default 'planned' check (status in ('planned', 'done', 'skipped', 'moved')),
  moved_from date,
  completed_session_id uuid references public.sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planned_sessions add column if not exists session_type text;
alter table public.planned_sessions add column if not exists duration_min integer;
alter table public.planned_sessions add column if not exists details_json jsonb not null default '{}'::jsonb;
alter table public.planned_sessions add column if not exists origin text not null default 'manual';
alter table public.planned_sessions add column if not exists moved_from date;
alter table public.planned_sessions add column if not exists completed_session_id uuid references public.sessions (id) on delete set null;
alter table public.planned_sessions add column if not exists updated_at timestamptz not null default now();

alter table public.planned_sessions drop constraint if exists planned_sessions_origin_check;
alter table public.planned_sessions add constraint planned_sessions_origin_check
  check (origin in ('manual', 'engine'));

alter table public.planned_sessions drop constraint if exists planned_sessions_duration_min_check;
alter table public.planned_sessions add constraint planned_sessions_duration_min_check
  check (duration_min is null or duration_min > 0);

create index if not exists planned_sessions_user_date_idx
  on public.planned_sessions (user_id, date);

-- ---------------------------------------------------------------------------
-- 11. Check-in quotidien forme / fatigue
-- ---------------------------------------------------------------------------
create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null default current_date,
  freshness_1_5 smallint not null check (freshness_1_5 between 1 and 5),
  soreness_1_5 smallint check (soreness_1_5 is null or soreness_1_5 between 1 and 5),
  note_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists daily_checkins_user_day_key
  on public.daily_checkins (user_id, checkin_date);

-- ---------------------------------------------------------------------------
-- 12. Catalogue d'exercices de départ (idempotent)
-- ---------------------------------------------------------------------------
insert into public.exercises (user_id, name, muscle_group, equipment, is_compound)
select null, v.name, v.muscle_group, v.equipment, v.is_compound
from (values
  ('Squat barre', 'Jambes', 'Barre', true),
  ('Squat gobelet', 'Jambes', 'Haltère', true),
  ('Presse à cuisses', 'Jambes', 'Machine', true),
  ('Fentes marchées', 'Jambes', 'Haltères', true),
  ('Soulevé de terre', 'Dos et jambes', 'Barre', true),
  ('Soulevé de terre roumain', 'Ischio-jambiers', 'Barre', true),
  ('Hip thrust', 'Fessiers', 'Barre', true),
  ('Leg extension', 'Quadriceps', 'Machine', false),
  ('Leg curl', 'Ischio-jambiers', 'Machine', false),
  ('Mollets debout', 'Mollets', 'Machine', false),
  ('Abduction hanches', 'Fessiers', 'Machine', false),
  ('Développé couché', 'Pectoraux', 'Barre', true),
  ('Développé incliné haltères', 'Pectoraux', 'Haltères', true),
  ('Pompes', 'Pectoraux', 'Poids du corps', true),
  ('Dips', 'Pectoraux et triceps', 'Poids du corps', true),
  ('Pec deck', 'Pectoraux', 'Machine', false),
  ('Tractions', 'Dos', 'Poids du corps', true),
  ('Tirage vertical', 'Dos', 'Poulie', true),
  ('Tirage horizontal', 'Dos', 'Poulie', true),
  ('Rowing barre', 'Dos', 'Barre', true),
  ('Rowing haltère', 'Dos', 'Haltère', true),
  ('Face pull', 'Épaules et dos', 'Poulie', false),
  ('Développé militaire', 'Épaules', 'Barre', true),
  ('Élévations latérales', 'Épaules', 'Haltères', false),
  ('Curl biceps', 'Bras', 'Haltères', false),
  ('Curl marteau', 'Bras', 'Haltères', false),
  ('Extension triceps poulie', 'Bras', 'Poulie', false),
  ('Barre au front', 'Bras', 'Barre', false),
  ('Gainage planche', 'Tronc', 'Poids du corps', false),
  ('Crunch', 'Tronc', 'Poids du corps', false),
  ('Relevé de jambes', 'Tronc', 'Poids du corps', false)
) as v(name, muscle_group, equipment, is_compound)
where not exists (
  select 1
  from public.exercises e
  where e.user_id is null
    and lower(e.name) = lower(v.name)
);

-- ---------------------------------------------------------------------------
-- 13. RLS — chaque compte ne voit et ne modifie que ses données
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.weight_entries enable row level security;
alter table public.injuries enable row level security;
alter table public.goals enable row level security;
alter table public.exercises enable row level security;
alter table public.sessions enable row level security;
alter table public.run_details enable row level security;
alter table public.strength_sets enable row level security;
alter table public.feelings enable row level security;
alter table public.planned_sessions enable row level security;
alter table public.daily_checkins enable row level security;

-- Profil
drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile"
  on public.profiles for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Poids
drop policy if exists "Users manage their own weight entries" on public.weight_entries;
create policy "Users manage their own weight entries"
  on public.weight_entries for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Blessures
drop policy if exists "Users manage their own injuries" on public.injuries;
create policy "Users manage their own injuries"
  on public.injuries for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Objectifs
drop policy if exists "Users manage their own goals" on public.goals;
create policy "Users manage their own goals"
  on public.goals for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Exercices : catalogue lisible par tous les comptes, exercices perso privés.
drop policy if exists "Users read catalog and their own exercises" on public.exercises;
create policy "Users read catalog and their own exercises"
  on public.exercises for select
  using (user_id is null or user_id = (select auth.uid()));

drop policy if exists "Users insert their own exercises" on public.exercises;
create policy "Users insert their own exercises"
  on public.exercises for insert
  with check (user_id = (select auth.uid()));

drop policy if exists "Users update their own exercises" on public.exercises;
create policy "Users update their own exercises"
  on public.exercises for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users delete their own exercises" on public.exercises;
create policy "Users delete their own exercises"
  on public.exercises for delete
  using (user_id = (select auth.uid()));

-- Séances
drop policy if exists "Users manage their own sessions" on public.sessions;
create policy "Users manage their own sessions"
  on public.sessions for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Détails course, séries et ressentis : via la séance parente.
drop policy if exists "Users manage details of their own sessions" on public.run_details;
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

drop policy if exists "Users manage sets of their own sessions" on public.strength_sets;
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

drop policy if exists "Users manage feelings of their own sessions" on public.feelings;
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

-- Séances planifiées
drop policy if exists "Users manage their own planned sessions" on public.planned_sessions;
create policy "Users manage their own planned sessions"
  on public.planned_sessions for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Check-in quotidien
drop policy if exists "Users manage their own daily checkins" on public.daily_checkins;
create policy "Users manage their own daily checkins"
  on public.daily_checkins for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 14. Triggers updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists injuries_set_updated_at on public.injuries;
create trigger injuries_set_updated_at
  before update on public.injuries
  for each row execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

drop trigger if exists run_details_set_updated_at on public.run_details;
create trigger run_details_set_updated_at
  before update on public.run_details
  for each row execute function public.set_updated_at();

drop trigger if exists strength_sets_set_updated_at on public.strength_sets;
create trigger strength_sets_set_updated_at
  before update on public.strength_sets
  for each row execute function public.set_updated_at();

drop trigger if exists feelings_set_updated_at on public.feelings;
create trigger feelings_set_updated_at
  before update on public.feelings
  for each row execute function public.set_updated_at();

drop trigger if exists planned_sessions_set_updated_at on public.planned_sessions;
create trigger planned_sessions_set_updated_at
  before update on public.planned_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists daily_checkins_set_updated_at on public.daily_checkins;
create trigger daily_checkins_set_updated_at
  before update on public.daily_checkins
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 15. Droits
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.weight_entries, public.injuries,
  public.goals, public.exercises, public.sessions, public.run_details,
  public.strength_sets, public.feelings, public.planned_sessions,
  public.daily_checkins
from anon;

grant select, insert, update, delete on public.profiles, public.weight_entries,
  public.injuries, public.goals, public.exercises, public.sessions,
  public.run_details, public.strength_sets, public.feelings,
  public.planned_sessions, public.daily_checkins
to authenticated;
