import { createClient } from '@/lib/supabase/client';
import type { LinkRelation, LinkedProfile } from '@/lib/types';
import { isFamilyRelation } from './engine';
import { loadProfile, saveProfile } from '@/lib/store/profile';

export interface AcceptInviteResult {
  ok: boolean;
  already?: boolean;
  error?: string;
  inviterId?: string;
  inviterName?: string;
  inviteeId?: string;
  inviteeName?: string;
  relation?: LinkRelation;
  inviteId?: string;
}

export interface InvitePreview {
  ok: boolean;
  error?: string;
  code?: string;
  relation?: LinkRelation;
  inviteeName?: string;
  inviterId?: string;
  inviterName?: string;
  createdAt?: string;
}

/** Persist invite row in Supabase (requires logged-in inviter). */
export async function pushInviteToSupabase(params: {
  code: string;
  inviteeName: string;
  inviteeEmail?: string;
  relation: LinkRelation;
  note?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'not_authenticated' };

    const { data, error } = await supabase
      .from('phalanx_invites')
      .insert({
        code: params.code.toUpperCase(),
        inviter_id: user.id,
        invitee_name: params.inviteeName,
        invitee_email: params.inviteeEmail || null,
        relation: params.relation,
        status: 'pending',
        note: params.note || null,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[Phalanx] pushInvite', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data.id as string };
  } catch (e) {
    console.warn('[Phalanx] pushInvite failed', e);
    return { ok: false, error: 'push_failed' };
  }
}

export async function fetchInvitePreview(code: string): Promise<InvitePreview> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_phalanx_invite_preview', {
      p_code: code.trim(),
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    const row = data as Record<string, unknown>;
    if (!row?.ok) {
      return { ok: false, error: String(row?.error || 'invite_not_found') };
    }
    return {
      ok: true,
      code: String(row.code || code),
      relation: row.relation as LinkRelation,
      inviteeName: String(row.invitee_name || ''),
      inviterId: String(row.inviter_id || ''),
      inviterName: String(row.inviter_name || ''),
      createdAt: String(row.created_at || ''),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'preview_failed' };
  }
}

/**
 * Accept invite by code for the current authenticated user.
 * Creates bidirectional phalanx_connections and updates local profile links.
 */
export async function acceptPhalanxInvite(code: string): Promise<AcceptInviteResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'not_authenticated' };

    const { data, error } = await supabase.rpc('accept_phalanx_invite', {
      p_code: code.trim(),
    });

    if (error) {
      console.warn('[Phalanx] accept rpc', error.message);
      return { ok: false, error: error.message };
    }

    const row = data as Record<string, unknown>;
    if (!row?.ok) {
      return { ok: false, error: String(row?.error || 'accept_failed') };
    }

    const relation = (row.relation as LinkRelation) || 'friend';
    const inviterId = String(row.inviter_id || '');
    const inviterName = String(row.inviter_name || 'Phalanx');
    const inviteId = String(row.invite_id || '');
    const inviteeName = String(row.invitee_name || '');

    // Merge into local profile graph for both sides' UI
    await mergeLocalConnection({
      peerUserId: inviterId,
      peerName: inviterName,
      relation,
      inviteId,
      inviteCode: code.toUpperCase(),
      // For inviter device we'll sync via fetchConnections
    });

    // Also refresh from server connections for accuracy
    await syncConnectionsFromServer();

    return {
      ok: true,
      already: !!row.already,
      inviterId,
      inviterName,
      inviteeId: String(row.invitee_id || user.id),
      inviteeName,
      relation,
      inviteId,
    };
  } catch (e) {
    console.warn('[Phalanx] accept failed', e);
    return { ok: false, error: e instanceof Error ? e.message : 'accept_failed' };
  }
}

async function mergeLocalConnection(params: {
  peerUserId: string;
  peerName: string;
  relation: LinkRelation;
  inviteId?: string;
  inviteCode?: string;
}) {
  const profile = loadProfile();
  const familyLinks = [...(profile.familyLinks || [])];
  const friendsLinks = [...(profile.friendsLinks || [])];
  const all = [...familyLinks, ...friendsLinks];

  // Update matching invite by code, or append connected peer
  let updated = false;
  const patch = (list: LinkedProfile[]) =>
    list.map((l) => {
      if (
        (params.inviteCode && l.inviteCode?.toUpperCase() === params.inviteCode.toUpperCase()) ||
        (params.peerUserId && l.peerUserId === params.peerUserId)
      ) {
        updated = true;
        return {
          ...l,
          name: params.peerName || l.name,
          status: 'connected' as const,
          peerUserId: params.peerUserId,
          inviteId: params.inviteId || l.inviteId,
          inviteCode: params.inviteCode || l.inviteCode,
          connectedAt: new Date().toISOString(),
          relation: params.relation || l.relation,
        };
      }
      return l;
    });

  let nextFamily = patch(familyLinks);
  let nextFriends = patch(friendsLinks);

  if (!updated && params.peerUserId) {
    const link: LinkedProfile = {
      id: params.inviteId || `peer_${params.peerUserId}`,
      name: params.peerName,
      relation: params.relation,
      status: 'connected',
      peerUserId: params.peerUserId,
      inviteId: params.inviteId,
      inviteCode: params.inviteCode,
      connectedAt: new Date().toISOString(),
    };
    if (isFamilyRelation(params.relation)) nextFamily = [...nextFamily, link];
    else nextFriends = [...nextFriends, link];
  }

  await saveProfile({
    ...profile,
    familyLinks: nextFamily,
    friendsLinks: nextFriends,
  });
}

/** Load connections from Supabase and merge into local profile links. */
export async function syncConnectionsFromServer(): Promise<LinkedProfile[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return listLocalLinks();

    const { data: rows, error } = await supabase
      .from('phalanx_connections')
      .select('id, peer_id, relation, invite_id, created_at')
      .eq('user_id', user.id);

    if (error || !rows?.length) {
      // also mark accepted outbound invites
      await syncOutboundInviteStatuses();
      return listLocalLinks();
    }

    const peerIds = rows.map((r) => r.peer_id as string);
    const { data: peers } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', peerIds);

    const peerMap = new Map(
      (peers || []).map((p) => [p.id as string, p as { id: string; name: string; avatar_url?: string }])
    );

    const profile = loadProfile();
    const byPeer = new Map<string, LinkedProfile>();

    // keep non-connected local invites
    for (const l of [...(profile.familyLinks || []), ...(profile.friendsLinks || [])]) {
      if (l.status !== 'connected' || !l.peerUserId) {
        byPeer.set(l.id, l);
      }
    }

    for (const r of rows) {
      const peerId = r.peer_id as string;
      const peer = peerMap.get(peerId);
      const relation = (r.relation as LinkRelation) || 'friend';
      const link: LinkedProfile = {
        id: (r.invite_id as string) || `conn_${peerId}`,
        name: peer?.name || 'Phalanx',
        relation,
        status: 'connected',
        peerUserId: peerId,
        inviteId: (r.invite_id as string) || undefined,
        avatarUrl: peer?.avatar_url || undefined,
        connectedAt: (r.created_at as string) || new Date().toISOString(),
      };
      byPeer.set(link.id, link);
    }

    // merge: connected peers + remaining invites without peer
    const all = Array.from(byPeer.values());
    const familyLinks = all.filter((l) => isFamilyRelation(l.relation));
    const friendsLinks = all.filter((l) => !isFamilyRelation(l.relation));

    // re-add pending invites that don't have peer yet
    for (const l of [...(profile.familyLinks || []), ...(profile.friendsLinks || [])]) {
      if (l.status === 'invited' || l.status === 'pending') {
        const exists = all.some(
          (x) =>
            x.inviteCode &&
            l.inviteCode &&
            x.inviteCode.toUpperCase() === l.inviteCode.toUpperCase()
        );
        if (!exists) {
          if (isFamilyRelation(l.relation)) familyLinks.push(l);
          else friendsLinks.push(l);
        }
      }
    }

    await saveProfile({ ...profile, familyLinks, friendsLinks });
    await syncOutboundInviteStatuses();
    return [...familyLinks, ...friendsLinks];
  } catch (e) {
    console.warn('[Phalanx] syncConnections', e);
    return listLocalLinks();
  }
}

/** When invitee accepts, inviter's pending rows become accepted — refresh statuses. */
async function syncOutboundInviteStatuses() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: invites } = await supabase
      .from('phalanx_invites')
      .select('id, code, status, invitee_id, invitee_name, relation, accepted_at')
      .eq('inviter_id', user.id);

    if (!invites?.length) return;

    const profile = loadProfile();
    const mapInvite = (l: LinkedProfile): LinkedProfile => {
      const match = invites.find(
        (i) =>
          (l.inviteCode && String(i.code).toUpperCase() === l.inviteCode.toUpperCase()) ||
          (l.inviteId && l.inviteId === i.id)
      );
      if (!match) return l;
      if (match.status === 'accepted' && match.invitee_id) {
        return {
          ...l,
          status: 'connected',
          peerUserId: match.invitee_id as string,
          inviteId: match.id as string,
          name: (match.invitee_name as string) || l.name,
          connectedAt: (match.accepted_at as string) || new Date().toISOString(),
          relation: (match.relation as LinkRelation) || l.relation,
        };
      }
      return { ...l, inviteId: match.id as string };
    };

    await saveProfile({
      ...profile,
      familyLinks: (profile.familyLinks || []).map(mapInvite),
      friendsLinks: (profile.friendsLinks || []).map(mapInvite),
    });
  } catch {
    // ignore
  }
}

function listLocalLinks(): LinkedProfile[] {
  const p = loadProfile();
  return [...(p.familyLinks || []), ...(p.friendsLinks || [])];
}

/** Try accept any stored inbound invite code after auth. */
export async function tryAcceptPendingInbound(): Promise<AcceptInviteResult | null> {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('salvazion_inbound_invite');
    if (!raw) return null;
    const inbound = JSON.parse(raw) as { code?: string; acceptedAt?: string };
    if (!inbound?.code || inbound.acceptedAt) return null;

    const result = await acceptPhalanxInvite(inbound.code);
    if (result.ok) {
      localStorage.setItem(
        'salvazion_inbound_invite',
        JSON.stringify({ ...inbound, acceptedAt: new Date().toISOString() })
      );
    }
    return result;
  } catch {
    return null;
  }
}
