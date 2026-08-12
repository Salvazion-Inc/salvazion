-- Allow Portuguese (pt) and Almeida ARC on existing Salvazion profiles.
-- Run in the Supabase SQL editor if the project already applied schema.sql.

alter table public.profiles drop constraint if exists profiles_language_check;
alter table public.profiles
  add constraint profiles_language_check
  check (language in ('es', 'en', 'pt'));

alter table public.profiles drop constraint if exists profiles_preferred_bible_version_check;
alter table public.profiles
  add constraint profiles_preferred_bible_version_check
  check (preferred_bible_version in ('rv1960', 'kjv', 'original', 'arc'));
