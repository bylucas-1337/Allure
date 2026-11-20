-- Allure — migration V8 « import FIT/GPX et analyse »
-- À coller dans le SQL Editor de Supabase, après la migration V7.
-- Rejouable sans perte de données.

-- ---------------------------------------------------------------------------
-- 1. Provenance et métadonnées d'import
-- ---------------------------------------------------------------------------
alter table public.run_sessions add column if not exists source text not null default 'manual';
alter table public.run_sessions add column if not exists import_key text;
alter table public.run_sessions add column if not exists imported_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Mesures issues des fichiers d'activité
-- ---------------------------------------------------------------------------
alter table public.run_sessions add column if not exists avg_hr smallint;
alter table public.run_sessions add column if not exists max_hr smallint;
alter table public.run_sessions add column if not exists elevation_gain_m integer;
alter table public.run_sessions add column if not exists calories integer;
alter table public.run_sessions add column if not exists moving_time_sec integer;
alter table public.run_sessions add column if not exists elapsed_time_sec integer;

-- Records calculés à l'import (1 km, 5 km, 10 km, semi, marathon), en secondes.
alter table public.run_sessions add column if not exists best_efforts jsonb not null default '{}'::jsonb;

-- Temps passés dans chaque zone de FC, en secondes.
alter table public.run_sessions add column if not exists hr_zones jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 3. Contraintes
-- ---------------------------------------------------------------------------
-- La borne haute passe de 600 à 1440 minutes pour les sorties longues importées.
-- La borne basse passe à 0 : une séance de 45 secondes est valide.
alter table public.run_sessions drop constraint if exists run_sessions_duration_min_check;
alter table public.run_sessions add constraint run_sessions_duration_min_check
  check (duration_min between 0 and 1440);

alter table public.run_sessions drop constraint if exists run_sessions_source_check;
alter table public.run_sessions add constraint run_sessions_source_check
  check (source in ('manual', 'fit', 'gpx'));

alter table public.run_sessions drop constraint if exists run_sessions_avg_hr_check;
alter table public.run_sessions add constraint run_sessions_avg_hr_check
  check (avg_hr is null or (avg_hr between 20 and 250));

alter table public.run_sessions drop constraint if exists run_sessions_max_hr_check;
alter table public.run_sessions add constraint run_sessions_max_hr_check
  check (max_hr is null or (max_hr between 20 and 250));

alter table public.run_sessions drop constraint if exists run_sessions_elevation_gain_check;
alter table public.run_sessions add constraint run_sessions_elevation_gain_check
  check (elevation_gain_m is null or (elevation_gain_m between 0 and 20000));

alter table public.run_sessions drop constraint if exists run_sessions_calories_check;
alter table public.run_sessions add constraint run_sessions_calories_check
  check (calories is null or (calories between 0 and 20000));

alter table public.run_sessions drop constraint if exists run_sessions_moving_time_check;
alter table public.run_sessions add constraint run_sessions_moving_time_check
  check (moving_time_sec is null or (moving_time_sec between 0 and 86400));

alter table public.run_sessions drop constraint if exists run_sessions_elapsed_time_check;
alter table public.run_sessions add constraint run_sessions_elapsed_time_check
  check (elapsed_time_sec is null or (elapsed_time_sec between 0 and 86400));

-- Un même fichier ne peut être importé qu'une fois par compte.
create unique index if not exists run_sessions_user_import_key_unique
  on public.run_sessions (user_id, import_key)
  where import_key is not null;

-- Accélère la détection des doublons lors d'un import.
create index if not exists run_sessions_user_source_idx
  on public.run_sessions (user_id, source);
