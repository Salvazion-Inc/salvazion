import type { Language, LinkRelation, LinkedProfile, UserProfile } from '@/lib/types';
import { loadProfile, saveProfile } from '@/lib/store/profile';

export type InviteCategory = 'family' | 'sibling' | 'friend' | 'colleague';

export interface InviteCategoryDef {
  id: InviteCategory;
  relation: LinkRelation;
  /** Emoji fallback */
  icon: string;
  /** Icono de marca Imagine — estilo Salvazion HUD */
  iconSrc: string;
  group: 'family' | 'circle';
}

/** Categories requested for the Phalanx invite UX */
export const INVITE_CATEGORIES: InviteCategoryDef[] = [
  {
    id: 'family',
    relation: 'family',
    icon: '👨‍👩‍👧‍👦',
    iconSrc: '/icons/invite/family.jpg',
    group: 'family',
  },
  {
    id: 'sibling',
    relation: 'sibling',
    icon: '🤝',
    iconSrc: '/icons/invite/sibling.jpg',
    group: 'family',
  },
  {
    id: 'friend',
    relation: 'friend',
    icon: '💚',
    iconSrc: '/icons/invite/friend.jpg',
    group: 'circle',
  },
  {
    id: 'colleague',
    relation: 'colleague',
    icon: '💼',
    iconSrc: '/icons/invite/colleague.jpg',
    group: 'circle',
  },
];

/** Extra relations still supported (onboarding / legacy) */
export const ALL_RELATIONS: LinkRelation[] = [
  'spouse',
  'child',
  'sibling',
  'family',
  'friend',
  'colleague',
  'faith_community',
];

export function isFamilyRelation(relation: LinkRelation): boolean {
  return ['spouse', 'child', 'sibling', 'family'].includes(relation);
}

export function relationLabel(relation: LinkRelation, lang: Language = 'en'): string {
  const es: Record<LinkRelation, string> = {
    spouse: 'Cónyuge',
    child: 'Hijo/a',
    sibling: 'Hermano/a',
    family: 'Familia',
    friend: 'Amigo/a',
    colleague: 'Colega',
    faith_community: 'Comunidad de fe',
  };
  const en: Record<LinkRelation, string> = {
    spouse: 'Spouse',
    child: 'Child',
    sibling: 'Sibling',
    family: 'Family',
    friend: 'Friend',
    colleague: 'Colleague',
    faith_community: 'Faith community',
  };
  const pt: Record<LinkRelation, string> = {
    spouse: 'Cônjuge',
    child: 'Filho/a',
    sibling: 'Irmão/ã',
    family: 'Família',
    friend: 'Amigo/a',
    colleague: 'Colega',
    faith_community: 'Comunidade de fé',
  };
  return (lang === 'pt' ? pt : lang === 'es' ? es : en)[relation] || relation;
}

export function categoryLabel(id: InviteCategory, lang: Language = 'en'): string {
  const es: Record<InviteCategory, string> = {
    family: 'Familia',
    sibling: 'Hermanos en la fe',
    friend: 'Amigos',
    colleague: 'Colegas',
  };
  const en: Record<InviteCategory, string> = {
    family: 'Family',
    sibling: 'Faith siblings',
    friend: 'Friends',
    colleague: 'Colleagues',
  };
  const pt: Record<InviteCategory, string> = {
    family: 'Família',
    sibling: 'Irmãos na fé',
    friend: 'Amigos',
    colleague: 'Colegas',
  };
  return (lang === 'pt' ? pt : lang === 'es' ? es : en)[id];
}

export function categoryHint(id: InviteCategory, lang: Language = 'en'): string {
  const es: Record<InviteCategory, string> = {
    family: 'Padres, cónyuge, hijos y familia extendida',
    sibling: 'Hermanos y hermanas de sangre o de la fe',
    friend: 'Amigos del camino y de la vida',
    colleague: 'Compañeros de trabajo, ministerio o proyectos',
  };
  const en: Record<InviteCategory, string> = {
    family: 'Parents, spouse, children and extended family',
    sibling: 'Brothers and sisters by blood or in the faith',
    friend: 'Friends for the journey of life',
    colleague: 'Coworkers, ministry partners and project teammates',
  };
  const pt: Record<InviteCategory, string> = {
    family: 'Pais, cônjuge, filhos e família estendida',
    sibling: 'Irmãos e irmãs de sangue ou da fé',
    friend: 'Amigos do caminho e da vida',
    colleague: 'Companheiros de trabalho, ministério ou projetos',
  };
  return (lang === 'pt' ? pt : lang === 'es' ? es : en)[id];
}

function randomCode(len = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const arr =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(len))
      : Array.from({ length: len }, () => Math.floor(Math.random() * 256));
  for (let i = 0; i < len; i++) {
    const n = Number((arr as ArrayLike<number>)[i] ?? 0);
    out += alphabet[n % alphabet.length];
  }
  return out;
}

export function newLinkId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `link_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface CreateInviteInput {
  name: string;
  relation: LinkRelation;
  email?: string;
  note?: string;
  inviterName?: string;
}

export interface CreateInviteResult {
  link: LinkedProfile;
  inviteUrl: string;
  shareText: string;
}

/** Build invite URL for signup with context */
export function buildInviteUrl(params: {
  code: string;
  inviterName: string;
  relation: LinkRelation;
  inviteeName?: string;
}): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://salvazion.com';
  const q = new URLSearchParams({
    invite: params.code,
    from: params.inviterName,
    relation: params.relation,
  });
  if (params.inviteeName) q.set('for', params.inviteeName);
  return `${origin}/auth/signup?${q.toString()}`;
}

export function buildShareText(
  params: {
    inviterName: string;
    inviteeName: string;
    relation: LinkRelation;
    inviteUrl: string;
  },
  lang: Language = 'en'
): string {
  const rel = relationLabel(params.relation, lang);
  if (lang === 'en') {
    return `Join the Community on Salvazion!

I'm building Salvation, Health and Freedom with the Green Lion Kings. I want you (${params.inviteeName}) in the Community as ${rel}.

Open the platform and grow with me in faith, family and virtue:

${params.inviteUrl}

— ${params.inviterName}
#Salvazion #GreenLionKings`;
  }
  if (lang === 'pt') {
    return `Junte-se à Comunidade na Salvazion!

Estou construindo Salvation, Health e Freedom com os Green Lion Kings. Quero você (${params.inviteeName}) na Comunidade como ${rel}.

Entre na plataforma e cresçamos juntos em fé, família e virtude:

${params.inviteUrl}

— ${params.inviterName}
#Salvazion #GreenLionKings`;
  }
  return `¡Únete a la Comunidad en Salvazion!

Estoy construyendo Salvation, Health y Freedom con los Green Lion Kings. Quiero que ${params.inviteeName} formes parte de la Comunidad como ${rel}.

Entra a la plataforma y crezcamos juntos en fe, familia y virtud:

${params.inviteUrl}

— ${params.inviterName}
#Salvazion #GreenLionKings`;
}

/**
 * Create an invite, append to profile links, persist locally + Supabase phalanx_invites.
 */
export async function createInvite(
  input: CreateInviteInput,
  lang: Language = 'en'
): Promise<CreateInviteResult | { error: string }> {
  const name = input.name.trim();
  if (!name) {
    return {
      error:
        lang === 'en'
          ? 'Name is required.'
          : lang === 'pt'
            ? 'O nome é obrigatório.'
            : 'El nombre es obligatorio.',
    };
  }

  // Dynamic import to avoid circular deps in edge cases
  const { pushInviteToSupabase } = await import('./supabase');

  const profile = loadProfile();
  const inviterName = (input.inviterName || profile.name || 'Salvazion').trim();
  const code = randomCode(8);

  const remote = await pushInviteToSupabase({
    code,
    inviteeName: name,
    inviteeEmail: input.email?.trim(),
    relation: input.relation,
    note: input.note?.trim(),
  });

  if (!remote.ok) {
    // Soft-fail: still allow local invite if tables missing, but warn
    console.warn('[Phalanx] Supabase invite not stored:', remote.error);
  }

  const link: LinkedProfile = {
    id: remote.ok ? remote.id : newLinkId(),
    name,
    relation: input.relation,
    status: 'invited',
    email: input.email?.trim() || undefined,
    inviteCode: code,
    inviteId: remote.ok ? remote.id : undefined,
    invitedAt: new Date().toISOString(),
    note: input.note?.trim() || undefined,
  };

  const familyLinks = [...(profile.familyLinks || [])];
  const friendsLinks = [...(profile.friendsLinks || [])];
  if (isFamilyRelation(input.relation)) {
    familyLinks.push(link);
  } else {
    friendsLinks.push(link);
  }

  await saveProfile({
    ...profile,
    familyLinks,
    friendsLinks,
  });

  const inviteUrl = buildInviteUrl({
    code,
    inviterName,
    relation: input.relation,
    inviteeName: name,
  });
  // Also offer login path for existing accounts
  const inviteUrlLogin = inviteUrl.replace('/auth/signup?', '/auth/login?');

  const shareText = buildShareText(
    {
      inviterName,
      inviteeName: name,
      relation: input.relation,
      inviteUrl: `${inviteUrl}\n\n${
        lang === 'en'
          ? 'Already have an account?'
          : lang === 'pt'
            ? 'Já tem conta?'
            : '¿Ya tienes cuenta?'
      } ${inviteUrlLogin}`,
    },
    lang
  );

  pushOutboundInvite({
    code,
    inviterName,
    relation: input.relation,
    inviteeName: name,
    createdAt: link.invitedAt!,
  });

  return { link, inviteUrl, shareText };
}

export function listAllLinks(profile?: Partial<UserProfile>): LinkedProfile[] {
  const p = profile || loadProfile();
  return [...(p.familyLinks || []), ...(p.friendsLinks || [])];
}

export function countInvites(profile?: Partial<UserProfile>): number {
  return listAllLinks(profile).length;
}

export async function removeLink(linkId: string): Promise<void> {
  const profile = loadProfile();
  await saveProfile({
    ...profile,
    familyLinks: (profile.familyLinks || []).filter((l) => l.id !== linkId),
    friendsLinks: (profile.friendsLinks || []).filter((l) => l.id !== linkId),
  });
}

export async function shareInviteText(shareText: string, title: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title, text: shareText });
      return 'shared';
    }
  } catch {
    // fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(shareText);
    return 'copied';
  } catch {
    return 'failed';
  }
}

// —— Outbound invite registry (device) ——
const OUTBOUND_KEY = 'salvazion_outbound_invites';

export interface OutboundInvite {
  code: string;
  inviterName: string;
  relation: LinkRelation;
  inviteeName: string;
  createdAt: string;
}

function pushOutboundInvite(inv: OutboundInvite) {
  if (typeof window === 'undefined') return;
  try {
    const prev = loadOutboundInvites();
    localStorage.setItem(OUTBOUND_KEY, JSON.stringify([inv, ...prev].slice(0, 100)));
  } catch {
    // ignore
  }
}

export function loadOutboundInvites(): OutboundInvite[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OUTBOUND_KEY);
    return raw ? (JSON.parse(raw) as OutboundInvite[]) : [];
  } catch {
    return [];
  }
}

// —— Inbound invite (signup) ——
const INBOUND_KEY = 'salvazion_inbound_invite';

export interface InboundInvite {
  code: string;
  from: string;
  relation: LinkRelation;
  forName?: string;
  acceptedAt?: string;
}

export function parseInviteFromSearchParams(
  params: URLSearchParams | { get(name: string): string | null }
): InboundInvite | null {
  const code = params.get('invite')?.trim();
  const from = params.get('from')?.trim();
  const relation = (params.get('relation')?.trim() || 'friend') as LinkRelation;
  const forName = params.get('for')?.trim() || undefined;
  if (!code && !from) return null;
  return {
    code: code || 'link',
    from: from || 'Community',
    relation: ALL_RELATIONS.includes(relation) ? relation : 'friend',
    forName,
  };
}

export function saveInboundInvite(inv: InboundInvite) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INBOUND_KEY, JSON.stringify(inv));
  } catch {
    // ignore
  }
}

export function loadInboundInvite(): InboundInvite | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(INBOUND_KEY);
    return raw ? (JSON.parse(raw) as InboundInvite) : null;
  } catch {
    return null;
  }
}

export function clearInboundInvite() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(INBOUND_KEY);
}
