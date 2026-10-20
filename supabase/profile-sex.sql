-- profiles.sex is in schema.sql but was missing on the live table.
-- PostgREST answered 400 on profiles?on_conflict=id for every upsert that sent it.
-- New column inherits the table grants already held by authenticated.
-- Do not TRUNCATE.

alter table public.profiles add column if not exists sex text;

alter table public.profiles drop constraint if exists profiles_sex_check;
alter table public.profiles
  add constraint profiles_sex_check
  check (sex is null or sex in ('female', 'male', 'unspecified'));
