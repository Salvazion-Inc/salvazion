-- ============================================================
-- SALVAZION — Supabase Schema + RLS
-- Run this entire file in the Supabase SQL Editor (once).
-- ============================================================

-- 1. Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  language text not null default 'es' check (language in ('es', 'en')),
  spiritual_maturity text not null default 'growing'
    check (spiritual_maturity in ('new', 'growing', 'mature', 'leader')),
  family_status text not null default 'family'
    check (family_status in ('single', 'married', 'parent', 'widow', 'family')),
  current_focus text[] not null default '{}',
  struggles text[] default '{}',
  preferred_bible_version text not null default 'rv1960'
    check (preferred_bible_version in ('rv1960', 'kjv', 'original')),
  purpose text default '',
  city text default '',
  country text default '',
  birth_date date,
  sex text check (sex is null or sex in ('female', 'male', 'unspecified')),
  avatar_url text,
  x_username text,
  x_user_id text,
  has_accepted_lion_coach boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe add for existing projects that already ran schema without avatar_url
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists x_username text;
alter table public.profiles add column if not exists x_user_id text;
alter table public.profiles add column if not exists sex text;

-- 2. Score actions (every logged action)
create table if not exists public.score_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  pillar text not null check (pillar in ('salvation', 'health', 'freedom')),
  points integer not null check (points >= 0),
  label text not null,
  action_date date not null default (current_date),
  created_at timestamptz not null default now()
);

create index if not exists score_actions_user_date_idx
  on public.score_actions (user_id, action_date desc);

create index if not exists score_actions_user_pillar_idx
  on public.score_actions (user_id, pillar);

-- 3. Streaks (one row per user)
create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  salvation integer not null default 0,
  health integer not null default 0,
  freedom integer not null default 0,
  last_active_salvation date,
  last_active_health date,
  last_active_freedom date,
  updated_at timestamptz not null default now()
);

-- 4. Badges earned
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ============================================================
-- RLS — enable and lock everything to the owner
-- ============================================================

alter table public.profiles enable row level security;
alter table public.score_actions enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_badges enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Score actions
create policy "Users can view own actions"
  on public.score_actions for select
  using (auth.uid() = user_id);

create policy "Users can insert own actions"
  on public.score_actions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own actions"
  on public.score_actions for delete
  using (auth.uid() = user_id);

-- Streaks
create policy "Users can view own streaks"
  on public.user_streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert own streaks"
  on public.user_streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streaks"
  on public.user_streaks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Badges
create policy "Users can view own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

create policy "Users can insert own badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup (trigger)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  insert into public.user_streaks (user_id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Updated_at helper
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists streaks_updated_at on public.user_streaks;
create trigger streaks_updated_at
  before update on public.user_streaks
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Done. Next steps in dashboard:
-- 1. Authentication → Providers → Email enabled
-- 2. Authentication → URL Configuration → add your site URL + /auth/callback
-- 3. Copy Project URL + anon key into .env.local
-- ============================================================

-- See also: phalanx.sql for invites/connections between real accounts

