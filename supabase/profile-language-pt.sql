-- Allow Portuguese on existing Salvazion profiles.
-- The bible-version check is unchanged.

alter table public.profiles drop constraint if exists profiles_language_check;
alter table public.profiles
  add constraint profiles_language_check
  check (language in ('es', 'en', 'pt'));
