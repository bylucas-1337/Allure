-- Allure — migration V2 « profil de programme »
-- À coller dans le SQL Editor de Supabase, après la migration V1.
--
-- Objectif : collecter ce qui sert vraiment à construire un programme, et
-- permettre plusieurs courses (une principale + des courses secondaires) sans
-- écraser l'objectif principal.
--
-- Rejouable sans perte de données : add column if not exists, drop constraint
-- if exists avant recréation, index partiels recréés à l'identique.

-- ---------------------------------------------------------------------------
-- 1. Profil : repères d'entraînement et préférences musculation
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists resting_hr smallint;
alter table public.profiles add column if not exists session_duration_min smallint;
alter table public.profiles add column if not exists strength_goal text;
alter table public.profiles add column if not exists target_muscle_groups jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists equipment jsonb not null default '[]'::jsonb;

alter table public.profiles drop constraint if exists profiles_resting_hr_check;
alter table public.profiles add constraint profiles_resting_hr_check
  check (resting_hr is null or resting_hr between 25 and 120);

alter table public.profiles drop constraint if exists profiles_session_duration_min_check;
alter table public.profiles add constraint profiles_session_duration_min_check
  check (session_duration_min is null or session_duration_min between 10 and 240);

-- Cinq intentions réalistes. « health » = bouger régulièrement sans objectif
-- esthétique ni performance.
alter table public.profiles drop constraint if exists profiles_strength_goal_check;
alter table public.profiles add constraint profiles_strength_goal_check
  check (
    strength_goal is null
    or strength_goal in ('hypertrophy', 'strength', 'endurance', 'recomposition', 'health')
  );

-- ---------------------------------------------------------------------------
-- 2. Objectifs : principal + courses secondaires
-- ---------------------------------------------------------------------------

alter table public.goals add column if not exists goal_kind text not null default 'main';
alter table public.goals add column if not exists target_value numeric(10, 2);
alter table public.goals add column if not exists target_unit text;
alter table public.goals add column if not exists target_exercise text;
alter table public.goals add column if not exists note_text text;

-- Une course secondaire peut ne pas avoir de distance mesurée à l'avance,
-- et un objectif de force/physique n'a pas de date obligatoire.
alter table public.goals alter column distance_m drop not null;
alter table public.goals alter column race_date drop not null;

alter table public.goals drop constraint if exists goals_sport_check;
alter table public.goals add constraint goals_sport_check
  check (sport in ('run', 'strength', 'body'));

alter table public.goals drop constraint if exists goals_kind_check;
alter table public.goals add constraint goals_kind_check
  check (goal_kind in ('main', 'secondary'));

alter table public.goals drop constraint if exists goals_distance_m_check;
alter table public.goals add constraint goals_distance_m_check
  check (distance_m is null or distance_m > 0);

alter table public.goals drop constraint if exists goals_target_value_check;
alter table public.goals add constraint goals_target_value_check
  check (target_value is null or target_value > 0);

-- Un seul objectif PRINCIPAL actif par sport, mais autant de courses
-- secondaires actives que nécessaire.
drop index if exists public.goals_one_active_per_sport;

create unique index if not exists goals_one_main_active_per_sport
  on public.goals (user_id, sport)
  where status = 'active' and goal_kind = 'main';

create index if not exists goals_user_date_idx
  on public.goals (user_id, race_date);

-- ---------------------------------------------------------------------------
-- 3. Rappel : la RLS existante couvre déjà ces colonnes
-- ---------------------------------------------------------------------------
-- Les politiques de la migration V1 s'appliquent à la table entière :
-- aucune politique supplémentaire n'est nécessaire pour les nouvelles colonnes.
