-- Allure — migration V3 « profil course »
-- À coller dans le SQL Editor de Supabase, après la migration V2.
--
-- Objectif : décrire précisément la pratique de course (volume, allures,
-- records, terrain) pour que le futur programme puisse proposer des séances
-- adaptées, sans redemander ces bases.
--
-- Rejouable sans perte de données.

-- ---------------------------------------------------------------------------
-- 1. Niveau et terrain
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists run_experience_level text;
alter table public.profiles add column if not exists run_surface text;

alter table public.profiles drop constraint if exists profiles_run_experience_level_check;
alter table public.profiles add constraint profiles_run_experience_level_check
  check (
    run_experience_level is null
    or run_experience_level in ('beginner', 'intermediate', 'advanced')
  );

alter table public.profiles drop constraint if exists profiles_run_surface_check;
alter table public.profiles add constraint profiles_run_surface_check
  check (
    run_surface is null
    or run_surface in ('road', 'trail', 'treadmill', 'mixed')
  );

-- ---------------------------------------------------------------------------
-- 2. Volume et allures (secondes par kilomètre)
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists run_weekly_km numeric(6, 1);
alter table public.profiles add column if not exists run_easy_pace_sec integer;
alter table public.profiles add column if not exists run_threshold_pace_sec integer;
alter table public.profiles add column if not exists run_race_pace_sec integer;

alter table public.profiles drop constraint if exists profiles_run_weekly_km_check;
alter table public.profiles add constraint profiles_run_weekly_km_check
  check (run_weekly_km is null or (run_weekly_km >= 0 and run_weekly_km <= 500));

-- Allure entre 2:00 et 20:00 par kilomètre : au-delà, c'est une saisie erronée.
alter table public.profiles drop constraint if exists profiles_run_easy_pace_sec_check;
alter table public.profiles add constraint profiles_run_easy_pace_sec_check
  check (run_easy_pace_sec is null or (run_easy_pace_sec between 120 and 1200));

alter table public.profiles drop constraint if exists profiles_run_threshold_pace_sec_check;
alter table public.profiles add constraint profiles_run_threshold_pace_sec_check
  check (run_threshold_pace_sec is null or (run_threshold_pace_sec between 120 and 1200));

alter table public.profiles drop constraint if exists profiles_run_race_pace_sec_check;
alter table public.profiles add constraint profiles_run_race_pace_sec_check
  check (run_race_pace_sec is null or (run_race_pace_sec between 120 and 1200));

-- ---------------------------------------------------------------------------
-- 3. Records personnels (secondes)
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists pb_5k_sec integer;
alter table public.profiles add column if not exists pb_10k_sec integer;
alter table public.profiles add column if not exists pb_half_sec integer;
alter table public.profiles add column if not exists pb_marathon_sec integer;

alter table public.profiles drop constraint if exists profiles_pb_5k_sec_check;
alter table public.profiles add constraint profiles_pb_5k_sec_check
  check (pb_5k_sec is null or (pb_5k_sec between 600 and 40000));

alter table public.profiles drop constraint if exists profiles_pb_10k_sec_check;
alter table public.profiles add constraint profiles_pb_10k_sec_check
  check (pb_10k_sec is null or (pb_10k_sec between 600 and 40000));

alter table public.profiles drop constraint if exists profiles_pb_half_sec_check;
alter table public.profiles add constraint profiles_pb_half_sec_check
  check (pb_half_sec is null or (pb_half_sec between 600 and 40000));

alter table public.profiles drop constraint if exists profiles_pb_marathon_sec_check;
alter table public.profiles add constraint profiles_pb_marathon_sec_check
  check (pb_marathon_sec is null or (pb_marathon_sec between 600 and 40000));

-- ---------------------------------------------------------------------------
-- 4. Rappel : jours et fréquences par sport
-- ---------------------------------------------------------------------------
-- Ils restent dans profiles.weekly_availability (jsonb), sous la forme :
-- {
--   "runDays": ["mon", "wed"],
--   "runSessionsPerWeek": 3,
--   "longRunDay": "sun",
--   "strengthDays": ["tue", "thu"],
--   "strengthSessionsPerWeek": 2
-- }
-- Aucune migration supplémentaire n'est nécessaire pour ces clés.
