-- ============================================================
-- X Auth — MINIMAL (si el script completo falla)
-- Copia y ejecuta SOLO esto en el SQL Editor
-- ============================================================

alter table public.profiles add column if not exists x_username text;
alter table public.profiles add column if not exists x_user_id text;

-- Comprueba:
select x_username, x_user_id from public.profiles limit 1;
