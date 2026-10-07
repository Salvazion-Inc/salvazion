-- ============================================================
-- Salvazion — verify-holdings v1 ($SALVAZION holder bonus)
-- Paste THIS ENTIRE script into Supabase → SQL Editor → Run.
-- Idempotent. Requires ai-usage.sql to be applied first.
--
-- * wallet_holder_links: one VERIFIED wallet per account and one account per
--   wallet (unique) so a single wallet cannot farm the bonus on many accounts.
--   Written only by the server (service role) after an ed25519 signature check.
-- * holder_verify_nonces: burned challenge nonces (replay protection).
-- * product_events: lightweight funnel events (bono_activado, upgrade_click).
-- ============================================================

create table if not exists public.wallet_holder_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wallet text not null,
  verified_at timestamptz not null default now(),
  balance_raw numeric(39,0) not null default 0 check (balance_raw >= 0),
  balance_ui numeric not null default 0,
  balance_checked_at timestamptz not null default now(),
  bonus_active boolean not null default false,
  bonus_activated_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint wallet_holder_links_wallet_unique unique (wallet)
);

alter table public.wallet_holder_links enable row level security;

drop policy if exists "Users can view own holder link" on public.wallet_holder_links;
create policy "Users can view own holder link"
  on public.wallet_holder_links for select
  using (auth.uid() = user_id);
-- No insert/update/delete policies: only the service role writes.

create table if not exists public.holder_verify_nonces (
  nonce text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet text not null,
  used_at timestamptz not null default now()
);

create index if not exists holder_verify_nonces_used_at_idx
  on public.holder_verify_nonces (used_at);

alter table public.holder_verify_nonces enable row level security;
-- No policies: service role only.

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  event text not null,
  user_id uuid references auth.users(id) on delete set null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_events_event_created_idx
  on public.product_events (event, created_at desc);

alter table public.product_events enable row level security;
-- No policies: service role only.

-- The legacy unverified profiles.solana_wallet column (ai-usage.sql) no longer
-- grants the bonus; it is kept only for the wallet UI. Nothing is dropped.
