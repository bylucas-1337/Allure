-- Allure — migration V7 « check-in quotidien »
-- À coller dans le SQL Editor de Supabase.
-- Rejouable sans perte de données, même si la table existe déjà.

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

alter table public.daily_checkins add column if not exists form smallint;
alter table public.daily_checkins add column if not exists fatigue smallint;
alter table public.daily_checkins add column if not exists pain text;
alter table public.daily_checkins add column if not exists notes text;

-- Migration des anciennes colonnes vers les nouvelles, puis suppression (idempotent).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'daily_checkins' and column_name = 'freshness_1_5'
  ) then
    execute 'update public.daily_checkins
             set form = coalesce(form, freshness_1_5),
                 fatigue = coalesce(fatigue, soreness_1_5),
                 notes = coalesce(notes, note_text)
             where freshness_1_5 is not null or soreness_1_5 is not null or note_text is not null';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='daily_checkins' and column_name='freshness_1_5') then
    alter table public.daily_checkins drop column freshness_1_5;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='daily_checkins' and column_name='soreness_1_5') then
    alter table public.daily_checkins drop column soreness_1_5;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='daily_checkins' and column_name='note_text') then
    alter table public.daily_checkins drop column note_text;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='daily_checkins' and column_name='updated_at') then
    alter table public.daily_checkins alter column updated_at drop not null;
    alter table public.daily_checkins alter column updated_at set default now();
  end if;
end $$;

-- Suppression des anciens triggers qui référencent updated_at (colonne supprimée).
do $$
declare
  trg record;
begin
  for trg in
    select tgname from pg_trigger
    where tgrelid = 'public.daily_checkins'::regclass and not tgisinternal
  loop
    execute format('drop trigger if exists %I on public.daily_checkins', trg.tgname);
  end loop;
end $$;
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'daily_checkins_user_id_checkin_date_key'
  ) then
    alter table public.daily_checkins
      add constraint daily_checkins_user_id_checkin_date_key unique (user_id, checkin_date);
  end if;
end $$;

alter table public.daily_checkins drop constraint if exists daily_checkins_form_check;
alter table public.daily_checkins add constraint daily_checkins_form_check
  check (form is null or (form between 1 and 5));

alter table public.daily_checkins drop constraint if exists daily_checkins_fatigue_check;
alter table public.daily_checkins add constraint daily_checkins_fatigue_check
  check (fatigue is null or (fatigue between 1 and 5));

create index if not exists daily_checkins_user_date_idx
  on public.daily_checkins (user_id, checkin_date desc);

alter table public.daily_checkins enable row level security;

drop policy if exists "daily_checkins_select_own" on public.daily_checkins;
create policy "daily_checkins_select_own"
  on public.daily_checkins for select
  using (auth.uid() = user_id);

drop policy if exists "daily_checkins_insert_own" on public.daily_checkins;
create policy "daily_checkins_insert_own"
  on public.daily_checkins for insert
  with check (auth.uid() = user_id);

drop policy if exists "daily_checkins_update_own" on public.daily_checkins;
create policy "daily_checkins_update_own"
  on public.daily_checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_checkins_delete_own" on public.daily_checkins;
create policy "daily_checkins_delete_own"
  on public.daily_checkins for delete
  using (auth.uid() = user_id);

-- Suppression de l'ancien trigger qui referencait updated_at.
drop trigger if exists daily_checkins_set_updated_at on public.daily_checkins;
