-- DEC-20261021-05 (under DEC-20261021-02): first-touch UTM on profiles.
-- Additive, nullable, idempotent. Existing RLS on public.profiles (own row
-- select/insert/update) already covers these columns; no new objects, so no
-- new GRANT is needed. No TRUNCATE, no DROP.
alter table public.profiles add column if not exists utm_source text;
alter table public.profiles add column if not exists utm_medium text;
alter table public.profiles add column if not exists utm_campaign text;
alter table public.profiles add column if not exists utm_content text;
alter table public.profiles add column if not exists utm_term text;
alter table public.profiles add column if not exists utm_captured_at timestamptz;

-- DOWN (documented only; do not run without a DEC):
-- alter table public.profiles
--   drop column if exists utm_source,
--   drop column if exists utm_medium,
--   drop column if exists utm_campaign,
--   drop column if exists utm_content,
--   drop column if exists utm_term,
--   drop column if exists utm_captured_at;
