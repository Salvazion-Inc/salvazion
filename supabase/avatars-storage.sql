-- ============================================================
-- SALVAZION — Profile avatars (multi-device: web ↔ mobile)
-- Paste this ENTIRE file in Supabase → SQL Editor → Run.
-- Safe to re-run (idempotent).
--
-- What this does:
-- 1) Ensures profiles.avatar_url exists
-- 2) Creates public Storage bucket "avatars"
-- 3) RLS policies: anyone can read; users write only their folder
--
-- App paths used:
--   {user_id}/avatar-{timestamp}.jpg   (preferred, versioned)
--   {user_id}/avatar.jpg               (legacy fallback)
-- ============================================================

-- 1) Column on profiles (source of truth for which URL to show)
alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Public https URL of profile photo (Supabase Storage or OAuth CDN). Custom Storage URLs must not be overwritten by OAuth login.';

-- 2) Public bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3) Policies on storage.objects
-- Drop old names if re-running (ignore missing)
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_owner_insert" on storage.objects;
drop policy if exists "avatars_owner_update" on storage.objects;
drop policy if exists "avatars_owner_delete" on storage.objects;

-- Public read (needed so mobile/web <img> can load without a session cookie on Storage)
create policy "avatars_public_read"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Insert only into own folder: first path segment = auth.uid()
create policy "avatars_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update own objects
create policy "avatars_owner_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete own objects (app cleans old versioned files)
create policy "avatars_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4) Sanity checks (optional readout in Results)
select
  'profiles.avatar_url' as check_item,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'avatar_url'
  ) as ok;

select
  'bucket.avatars' as check_item,
  exists (
    select 1 from storage.buckets where id = 'avatars' and public = true
  ) as ok;

select
  'policies.avatars' as check_item,
  count(*)::int as policy_count
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'avatars_%';
