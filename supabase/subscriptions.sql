-- ============================================================
-- Salvazion Premium subscriptions (Stripe)
-- Paste THIS ENTIRE script into Supabase → SQL Editor → Run
-- (Do not paste the file path "supabase/subscriptions.sql")
-- ============================================================

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'none',
  price_id text,
  billing_interval text check (
    billing_interval is null or billing_interval in ('month', 'year')
  ),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription row (writes only via service role / webhook)
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);
