-- ============================================================
-- X (Twitter) OAuth profile fields
-- Run once in Supabase SQL Editor after schema.sql
-- ============================================================

alter table public.profiles add column if not exists x_username text;
alter table public.profiles add column if not exists x_user_id text;

create index if not exists profiles_x_username_idx
  on public.profiles (x_username)
  where x_username is not null;

comment on column public.profiles.x_username is 'X/Twitter handle without @ (from OAuth)';
comment on column public.profiles.x_user_id is 'X/Twitter provider user id';
