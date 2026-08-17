-- ============================================================
-- Salvazion AI usage quotas (Free limited / Premium unlimited)
-- + linked Solana wallet for $SALVAZION holder bonus
-- Paste THIS ENTIRE script into Supabase → SQL Editor → Run
-- ============================================================

alter table public.profiles add column if not exists solana_wallet text;

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  period_start date not null,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, feature, period_start)
);

create index if not exists ai_usage_user_feature_idx
  on public.ai_usage (user_id, feature, period_start desc);

alter table public.ai_usage enable row level security;

drop policy if exists "Users can view own ai usage" on public.ai_usage;
create policy "Users can view own ai usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

-- Atomic reserve: increment then reject if over limit
create or replace function public.consume_ai_usage(
  p_user_id uuid,
  p_feature text,
  p_period_start date,
  p_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_limit is null or p_limit < 0 then
    return jsonb_build_object('allowed', false, 'used', 0, 'limit', 0);
  end if;

  insert into public.ai_usage (user_id, feature, period_start, count)
  values (p_user_id, p_feature, p_period_start, 1)
  on conflict (user_id, feature, period_start)
  do update set
    count = public.ai_usage.count + 1,
    updated_at = now()
  returning count into v_count;

  if v_count > p_limit then
    update public.ai_usage
      set count = count - 1,
          updated_at = now()
      where user_id = p_user_id
        and feature = p_feature
        and period_start = p_period_start
        and count > 0;
    return jsonb_build_object(
      'allowed', false,
      'used', p_limit,
      'limit', p_limit,
      'remaining', 0
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', v_count,
    'limit', p_limit,
    'remaining', greatest(p_limit - v_count, 0)
  );
end;
$$;

revoke all on function public.consume_ai_usage(uuid, text, date, integer) from public;
grant execute on function public.consume_ai_usage(uuid, text, date, integer) to service_role;
