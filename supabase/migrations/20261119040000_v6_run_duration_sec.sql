-- Allure — migration V6 « durée en secondes pour les séances de course »
-- À coller dans le SQL Editor de Supabase, après la migration V4.
-- Rejouable sans perte de données.

alter table public.run_sessions add column if not exists duration_sec smallint;

alter table public.run_sessions drop constraint if exists run_sessions_duration_sec_check;
alter table public.run_sessions add constraint run_sessions_duration_sec_check
  check (duration_sec is null or (duration_sec between 0 and 59));
