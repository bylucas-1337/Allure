-- Allure — migration V9 « moteur de plans » (V2.0)
-- À coller dans le SQL Editor de Supabase, après la migration V8.
-- Rejouable sans perte de données.

-- ---------------------------------------------------------------------------
-- 0. Colonnes complémentaires au profil (course + FC)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists hr_max integer check (hr_max is null or hr_max between 100 and 230);
alter table public.profiles add column if not exists baseline_weekly_km numeric(6, 2) check (baseline_weekly_km is null or baseline_weekly_km >= 0);
alter table public.profiles add column if not exists max_weekly_km numeric(6, 2) check (max_weekly_km is null or max_weekly_km >= 0);

-- ---------------------------------------------------------------------------
-- 1. Plan d'entraînement (lié à un objectif de course principal)
-- ---------------------------------------------------------------------------
create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  name text not null default 'Plan course',
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'abandoned')),
  start_date date not null,
  end_date date not null,
  vdot numeric(5, 2),
  vdot_source text check (vdot_source is null or vdot_source in ('record_5k', 'record_10k', 'record_half', 'record_marathon', 'estimated')),
  vdot_is_estimated boolean not null default false,
  reference_volume_km numeric(6, 2),
  notes_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

alter table public.training_plans add column if not exists vdot numeric(5, 2);
alter table public.training_plans add column if not exists vdot_source text;
alter table public.training_plans add column if not exists vdot_is_estimated boolean not null default false;
alter table public.training_plans add column if not exists reference_volume_km numeric(6, 2);
alter table public.training_plans add column if not exists notes_text text;
alter table public.training_plans add column if not exists updated_at timestamptz not null default now();

create index if not exists training_plans_user_status_idx
  on public.training_plans (user_id, status);
create index if not exists training_plans_user_goal_idx
  on public.training_plans (user_id, goal_id);

-- ---------------------------------------------------------------------------
-- 2. Règles appliquées par le moteur (transparence)
-- ---------------------------------------------------------------------------
create table if not exists public.plan_rules (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans (id) on delete cascade,
  rule_key text not null,
  rule_value jsonb not null default '{}'::jsonb,
  explanation text,
  created_at timestamptz not null default now()
);

create index if not exists plan_rules_plan_idx
  on public.plan_rules (plan_id);

-- ---------------------------------------------------------------------------
-- 3. Séances proposées par le moteur (source du plan)
-- ---------------------------------------------------------------------------
create table if not exists public.plan_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  sport text not null default 'run' check (sport in ('run')),
  session_type text not null default 'easy' check (session_type in ('easy', 'threshold', 'intervals', 'long', 'recovery', 'race', 'other')),
  duration_min integer not null check (duration_min > 0),
  distance_m integer check (distance_m is null or distance_m >= 0),
  target_zone text check (target_zone is null or target_zone in ('E', 'M', 'T', 'I', 'R')),
  target_pace_sec_per_km integer check (target_pace_sec_per_km is null or target_pace_sec_per_km > 0),
  rationale_text text,
  recalculation_reason text,
  is_locked boolean not null default false,
  status text not null default 'planned' check (status in ('planned', 'done', 'skipped', 'moved')),
  planned_session_id uuid references public.planned_sessions (id) on delete set null,
  completed_session_id uuid references public.run_sessions (id) on delete set null,
  moved_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plan_sessions add column if not exists target_zone text;
alter table public.plan_sessions add column if not exists target_pace_sec_per_km integer;
alter table public.plan_sessions add column if not exists rationale_text text;
alter table public.plan_sessions add column if not exists recalculation_reason text;
alter table public.plan_sessions add column if not exists is_locked boolean not null default false;
alter table public.plan_sessions add column if not exists planned_session_id uuid references public.planned_sessions (id) on delete set null;
alter table public.plan_sessions add column if not exists completed_session_id uuid references public.run_sessions (id) on delete set null;
alter table public.plan_sessions add column if not exists moved_from date;
alter table public.plan_sessions add column if not exists updated_at timestamptz not null default now();

create index if not exists plan_sessions_plan_date_idx
  on public.plan_sessions (plan_id, session_date);
create index if not exists plan_sessions_user_date_idx
  on public.plan_sessions (user_id, session_date desc);

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
alter table public.training_plans enable row level security;
alter table public.plan_rules enable row level security;
alter table public.plan_sessions enable row level security;

-- Plans
drop policy if exists "Users manage their own training plans" on public.training_plans;
create policy "Users manage their own training plans"
  on public.training_plans for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Règles : via le plan parent
drop policy if exists "Users manage rules of their own plans" on public.plan_rules;
create policy "Users manage rules of their own plans"
  on public.plan_rules for all
  using (
    exists (
      select 1 from public.training_plans
      where training_plans.id = plan_rules.plan_id
        and training_plans.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.training_plans
      where training_plans.id = plan_rules.plan_id
        and training_plans.user_id = (select auth.uid())
    )
  );

-- Séances de plan : via user_id
drop policy if exists "Users manage their own plan sessions" on public.plan_sessions;
create policy "Users manage their own plan sessions"
  on public.plan_sessions for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. Triggers updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists training_plans_set_updated_at on public.training_plans;
create trigger training_plans_set_updated_at
  before update on public.training_plans
  for each row execute function public.set_updated_at();

drop trigger if exists plan_sessions_set_updated_at on public.plan_sessions;
create trigger plan_sessions_set_updated_at
  before update on public.plan_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Droits
-- ---------------------------------------------------------------------------
revoke all on public.training_plans, public.plan_rules, public.plan_sessions from anon;
grant select, insert, update, delete on public.training_plans, public.plan_rules, public.plan_sessions to authenticated;