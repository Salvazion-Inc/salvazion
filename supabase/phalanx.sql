-- ============================================================
-- SALVAZION — Phalanx invites & connections (real accounts)
-- Run in Supabase SQL Editor (once) on an existing project.
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS patterns).
-- ============================================================

-- 1. Invites (created by inviter, accepted by invitee)
create table if not exists public.phalanx_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  invitee_name text not null default '',
  invitee_email text,
  relation text not null default 'friend'
    check (relation in (
      'spouse','child','sibling','family','friend','colleague','faith_community'
    )),
  status text not null default 'pending'
    check (status in ('pending','accepted','revoked','expired')),
  invitee_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint phalanx_invites_no_self check (invitee_id is null or invitee_id <> inviter_id)
);

create index if not exists phalanx_invites_inviter_idx on public.phalanx_invites (inviter_id);
create index if not exists phalanx_invites_code_idx on public.phalanx_invites (code);
create index if not exists phalanx_invites_invitee_idx on public.phalanx_invites (invitee_id);

-- 2. Connections (one row per user perspective; two rows per pair)
create table if not exists public.phalanx_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  peer_id uuid not null references auth.users(id) on delete cascade,
  relation text not null default 'friend'
    check (relation in (
      'spouse','child','sibling','family','friend','colleague','faith_community'
    )),
  invite_id uuid references public.phalanx_invites(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, peer_id),
  constraint phalanx_connections_no_self check (user_id <> peer_id)
);

create index if not exists phalanx_connections_user_idx on public.phalanx_connections (user_id);
create index if not exists phalanx_connections_peer_idx on public.phalanx_connections (peer_id);

-- 3. RLS
alter table public.phalanx_invites enable row level security;
alter table public.phalanx_connections enable row level security;

-- Invites: inviter manages own; invitee can see after accept
drop policy if exists "Inviters manage own invites" on public.phalanx_invites;
create policy "Inviters manage own invites"
  on public.phalanx_invites for all
  using (auth.uid() = inviter_id)
  with check (auth.uid() = inviter_id);

drop policy if exists "Invitees can view invites they accepted" on public.phalanx_invites;
create policy "Invitees can view invites they accepted"
  on public.phalanx_invites for select
  using (auth.uid() = invitee_id);

-- Allow authenticated users to look up a pending invite by code (needed before accept)
-- Limited columns via RPC; still need select for optional client fetch:
drop policy if exists "Authenticated can read pending invite by code" on public.phalanx_invites;
create policy "Authenticated can read pending invite by code"
  on public.phalanx_invites for select
  using (status = 'pending' and auth.role() = 'authenticated');

-- Connections: only own rows
drop policy if exists "Users view own connections" on public.phalanx_connections;
create policy "Users view own connections"
  on public.phalanx_connections for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own connections" on public.phalanx_connections;
create policy "Users insert own connections"
  on public.phalanx_connections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own connections" on public.phalanx_connections;
create policy "Users delete own connections"
  on public.phalanx_connections for delete
  using (auth.uid() = user_id);

-- Allow reading peer display name for connected users
drop policy if exists "Users can view connected peer profiles" on public.profiles;
create policy "Users can view connected peer profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.phalanx_connections c
      where c.user_id = auth.uid() and c.peer_id = profiles.id
    )
  );

-- 4. Accept invite (atomic, security definer)
create or replace function public.accept_phalanx_invite(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.phalanx_invites%rowtype;
  v_inviter_name text;
  v_invitee_name text;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_code is null or length(trim(p_code)) < 4 then
    return json_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select * into v_inv
  from public.phalanx_invites
  where upper(code) = upper(trim(p_code))
  for update;

  if not found then
    return json_build_object('ok', false, 'error', 'invite_not_found');
  end if;

  if v_inv.status = 'accepted' and v_inv.invitee_id = v_uid then
    -- idempotent re-accept
    select name into v_inviter_name from public.profiles where id = v_inv.inviter_id;
    select name into v_invitee_name from public.profiles where id = v_uid;
    return json_build_object(
      'ok', true,
      'already', true,
      'invite_id', v_inv.id,
      'inviter_id', v_inv.inviter_id,
      'inviter_name', coalesce(v_inviter_name, ''),
      'invitee_id', v_uid,
      'invitee_name', coalesce(v_invitee_name, ''),
      'relation', v_inv.relation
    );
  end if;

  if v_inv.status <> 'pending' then
    return json_build_object('ok', false, 'error', 'invite_not_pending');
  end if;

  if v_inv.inviter_id = v_uid then
    return json_build_object('ok', false, 'error', 'cannot_accept_own');
  end if;

  -- already connected?
  if exists (
    select 1 from public.phalanx_connections
    where user_id = v_uid and peer_id = v_inv.inviter_id
  ) then
    update public.phalanx_invites
      set status = 'accepted', invitee_id = v_uid, accepted_at = now()
      where id = v_inv.id;
    select name into v_inviter_name from public.profiles where id = v_inv.inviter_id;
    select name into v_invitee_name from public.profiles where id = v_uid;
    return json_build_object(
      'ok', true,
      'already', true,
      'invite_id', v_inv.id,
      'inviter_id', v_inv.inviter_id,
      'inviter_name', coalesce(v_inviter_name, ''),
      'invitee_id', v_uid,
      'invitee_name', coalesce(v_invitee_name, ''),
      'relation', v_inv.relation
    );
  end if;

  update public.phalanx_invites
    set status = 'accepted',
        invitee_id = v_uid,
        accepted_at = now()
    where id = v_inv.id;

  -- bidirectional edges
  insert into public.phalanx_connections (user_id, peer_id, relation, invite_id)
  values (v_inv.inviter_id, v_uid, v_inv.relation, v_inv.id)
  on conflict (user_id, peer_id) do update
    set relation = excluded.relation, invite_id = excluded.invite_id;

  insert into public.phalanx_connections (user_id, peer_id, relation, invite_id)
  values (v_uid, v_inv.inviter_id, v_inv.relation, v_inv.id)
  on conflict (user_id, peer_id) do update
    set relation = excluded.relation, invite_id = excluded.invite_id;

  select name into v_inviter_name from public.profiles where id = v_inv.inviter_id;
  select name into v_invitee_name from public.profiles where id = v_uid;

  return json_build_object(
    'ok', true,
    'already', false,
    'invite_id', v_inv.id,
    'inviter_id', v_inv.inviter_id,
    'inviter_name', coalesce(v_inviter_name, ''),
    'invitee_id', v_uid,
    'invitee_name', coalesce(v_invitee_name, ''),
    'relation', v_inv.relation
  );
end;
$$;

revoke all on function public.accept_phalanx_invite(text) from public;
grant execute on function public.accept_phalanx_invite(text) to authenticated;

-- Lookup pending invite preview (for accept UI)
create or replace function public.get_phalanx_invite_preview(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.phalanx_invites%rowtype;
  v_name text;
begin
  if auth.uid() is null then
    return json_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into v_inv
  from public.phalanx_invites
  where upper(code) = upper(trim(p_code)) and status = 'pending';

  if not found then
    return json_build_object('ok', false, 'error', 'invite_not_found');
  end if;

  select name into v_name from public.profiles where id = v_inv.inviter_id;

  return json_build_object(
    'ok', true,
    'code', v_inv.code,
    'relation', v_inv.relation,
    'invitee_name', v_inv.invitee_name,
    'inviter_id', v_inv.inviter_id,
    'inviter_name', coalesce(v_name, ''),
    'created_at', v_inv.created_at
  );
end;
$$;

revoke all on function public.get_phalanx_invite_preview(text) from public;
grant execute on function public.get_phalanx_invite_preview(text) to authenticated;

-- ============================================================
-- Done. After running:
-- 1. Table Editor should show phalanx_invites + phalanx_connections
-- 2. Create invite from Profile → share link
-- 3. Second user signs up / logs in with ?invite=CODE → auto-accept
-- ============================================================
