-- ============================================================
-- X (Twitter) OAuth profile fields — idempotent / safe to re-run
-- Supabase SQL Editor → New query → Run
-- ============================================================

-- 0) Ensure public.profiles exists (if you never ran schema.sql)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  language text not null default 'es',
  spiritual_maturity text not null default 'growing',
  family_status text not null default 'family',
  current_focus text[] not null default '{}',
  struggles text[] default '{}',
  preferred_bible_version text not null default 'rv1960',
  purpose text default '',
  city text default '',
  country text default '',
  birth_date date,
  avatar_url text,
  has_accepted_lion_coach boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1) Add X columns (safe if already present)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'x_username'
  ) then
    alter table public.profiles add column x_username text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'x_user_id'
  ) then
    alter table public.profiles add column x_user_id text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'avatar_url'
  ) then
    alter table public.profiles add column avatar_url text;
  end if;
end $$;

-- 2) Index for lookups by handle (ignore if already exists)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'profiles_x_username_idx'
  ) then
    execute 'create index profiles_x_username_idx on public.profiles (x_username) where x_username is not null';
  end if;
end $$;

-- 3) Comments (optional — never fail the migration)
do $$
begin
  comment on column public.profiles.x_username is 'X/Twitter handle without @ (from OAuth)';
  comment on column public.profiles.x_user_id is 'X/Twitter provider user id';
exception
  when others then
    raise notice 'comment skipped: %', sqlerrm;
end $$;

-- 4) RLS (only if not already enabled)
alter table public.profiles enable row level security;

-- Own-row policies (create only if missing)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can view own profile'
  ) then
    create policy "Users can view own profile"
      on public.profiles for select
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.profiles for insert
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles for update
      using (auth.uid() = id);
  end if;
end $$;

-- 5) Verify
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('x_username', 'x_user_id', 'avatar_url', 'name')
order by column_name;
