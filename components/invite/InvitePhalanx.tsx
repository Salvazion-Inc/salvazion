'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LinkRelation, LinkedProfile, UserProfile } from '@/lib/types';
import {
  INVITE_CATEGORIES,
  categoryHint,
  categoryLabel,
  createInvite,
  listAllLinks,
  loadInboundInvite,
  relationLabel,
  removeLink,
  shareInviteText,
  type InviteCategory,
} from '@/lib/invite/engine';
import {
  acceptPhalanxInvite,
  fetchInvitePreview,
  syncConnectionsFromServer,
  tryAcceptPendingInbound,
} from '@/lib/invite/supabase';
import { loadProfileAsync } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';

interface Props {
  /** When provided, parent controls refresh */
  onChanged?: (links: LinkedProfile[]) => void;
  className?: string;
}

export default function InvitePhalanx({ onChanged, className = '' }: Props) {
  const { t, lang } = useI18n();
  const [links, setLinks] = useState<LinkedProfile[]>([]);
  const [profileName, setProfileName] = useState('');
  const [category, setCategory] = useState<InviteCategory>('family');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | InviteCategory>('all');
  const [acceptCode, setAcceptCode] = useState('');
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [pendingBanner, setPendingBanner] = useState<{
    code: string;
    from: string;
    relation: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    await syncConnectionsFromServer();
    const p = await loadProfileAsync();
    setProfileName(p.name || '');
    const all = listAllLinks(p);
    setLinks(all);
    onChanged?.(all);
  }, [onChanged]);

  useEffect(() => {
    void (async () => {
      // Auto-accept inbound invite after signup/login
      const auto = await tryAcceptPendingInbound();
      if (auto?.ok) {
        setSuccess(
          auto.already
            ? t('invite.alreadyConnected')
            : t('invite.acceptedWith', { name: auto.inviterName || 'Phalanx' })
        );
      }
      const inbound = loadInboundInvite();
      if (inbound?.code && !inbound.acceptedAt) {
        setAcceptCode(inbound.code);
        setPendingBanner({
          code: inbound.code,
          from: inbound.from,
          relation: relationLabel(inbound.relation, lang),
        });
        // enrich with server preview if possible
        const preview = await fetchInvitePreview(inbound.code);
        if (preview.ok && preview.inviterName) {
          setPendingBanner({
            code: inbound.code,
            from: preview.inviterName,
            relation: relationLabel(preview.relation || inbound.relation, lang),
          });
        }
      }
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const catDef = INVITE_CATEGORIES.find((c) => c.id === category)!;

  const filtered = useMemo(() => {
    if (filter === 'all') return links;
    const rel = INVITE_CATEGORIES.find((c) => c.id === filter)?.relation;
    return links.filter((l) => l.relation === rel || (filter === 'family' && ['spouse', 'child', 'family'].includes(l.relation)));
  }, [links, filter]);

  const handleInvite = async () => {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const result = await createInvite(
        {
          name,
          relation: catDef.relation,
          email: email || undefined,
          inviterName: profileName,
        },
        lang
      );
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setLastUrl(result.inviteUrl);
      const shareResult = await shareInviteText(
        result.shareText,
        lang === 'en' ? 'Join my Phalanx — Salvazion' : 'Únete a mi Phalanx — Salvazion'
      );
      setSuccess(
        shareResult === 'shared'
          ? t('invite.shared')
          : shareResult === 'copied'
            ? t('invite.copied')
            : t('invite.created')
      );
      setName('');
      setEmail('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    await removeLink(id);
    await refresh();
  };

  const handleAcceptCode = async (code?: string) => {
    const c = (code || acceptCode).trim();
    if (!c) {
      setError(t('invite.codeRequired'));
      return;
    }
    setAcceptBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await acceptPhalanxInvite(c);
      if (!result.ok) {
        const map: Record<string, string> = {
          invite_not_found: t('invite.errNotFound'),
          invite_not_pending: t('invite.errNotPending'),
          cannot_accept_own: t('invite.errOwn'),
          not_authenticated: t('invite.errAuth'),
        };
        setError(map[result.error || ''] || result.error || t('invite.errGeneric'));
        return;
      }
      setSuccess(
        result.already
          ? t('invite.alreadyConnected')
          : t('invite.acceptedWith', { name: result.inviterName || 'Phalanx' })
      );
      setPendingBanner(null);
      setAcceptCode('');
      await refresh();
    } finally {
      setAcceptBusy(false);
    }
  };

  const copyLast = async () => {
    if (!lastUrl) return;
    try {
      await navigator.clipboard.writeText(lastUrl);
      setSuccess(t('invite.linkCopied'));
    } catch {
      setError(t('invite.copyFailed'));
    }
  };

  return (
    <div className={`glass rounded-2xl p-5 space-y-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--sage)]">Phalanx</p>
          <h3 className="text-base font-semibold text-[#8FD99A] mt-0.5">{t('invite.title')}</h3>
          <p className="text-xs text-[var(--sage)]/55 mt-1 leading-relaxed">{t('invite.subtitle')}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--border-strong)] text-[#8FD99A] shrink-0">
          {links.length} {t('invite.count')}
        </span>
      </div>

      {/* Accept invite (existing account or after signup) */}
      <div className="rounded-xl border border-[#8FD99A]/25 bg-[#7BC98A]/05 p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-[#8FD99A]">{t('invite.acceptTitle')}</p>
          <p className="text-[11px] text-[var(--sage)]/55 mt-0.5">{t('invite.acceptHint')}</p>
        </div>
        {pendingBanner && (
          <div className="rounded-lg border border-[var(--border-strong)] bg-[#040404]/60 px-3 py-2 text-xs text-[#D8E1D9]/90">
            <span className="text-[#8FD99A] font-semibold">{pendingBanner.from}</span>{' '}
            {t('invite.invitedYou')} {t('invite.asRelation')}{' '}
            <span className="text-[var(--sage)]">{pendingBanner.relation}</span>.
            <button
              type="button"
              disabled={acceptBusy}
              onClick={() => handleAcceptCode(pendingBanner.code)}
              className="mt-2 w-full py-2 rounded-lg bg-[#7BC98A] text-[#040404] font-semibold text-xs hover:bg-[#B7F7AC] disabled:opacity-50"
            >
              {acceptBusy ? t('invite.accepting') : t('invite.acceptNow')}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={acceptCode}
            onChange={(e) => setAcceptCode(e.target.value.toUpperCase())}
            placeholder={t('invite.codePlaceholder')}
            className="flex-1 bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:border-[#8FD99A] uppercase"
          />
          <button
            type="button"
            disabled={acceptBusy || !acceptCode.trim()}
            onClick={() => handleAcceptCode()}
            className="shrink-0 px-4 py-2.5 rounded-xl border border-[var(--border-strong)] text-[#8FD99A] text-xs font-semibold hover:bg-[var(--surface-active)] disabled:opacity-50"
          >
            {t('invite.accept')}
          </button>
        </div>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-2">
        {INVITE_CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`text-left rounded-xl border px-3 py-3 transition-all ${
                active
                  ? 'border-[#8FD99A] bg-[#7BC98A]/12 shadow-[0_0_16px_rgba(143, 217, 154,0.12)]'
                  : 'border-[var(--border-soft)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="text-xl mb-1">{c.icon}</div>
              <div className={`text-sm font-semibold ${active ? 'text-[#8FD99A]' : 'text-white'}`}>
                {categoryLabel(c.id, lang)}
              </div>
              <div className="text-[10px] text-[var(--sage)]/80 leading-snug mt-0.5">
                {categoryHint(c.id, lang)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <div className="space-y-3 rounded-xl border border-[var(--border-soft)] bg-[#040404]/40 p-4">
        <p className="text-[11px] text-[var(--sage)]">
          {t('invite.invitingAs')}{' '}
          <span className="text-[#8FD99A] font-medium">
            {relationLabel(catDef.relation, lang)}
          </span>
        </p>
        <div>
          <label className="block text-xs text-[var(--sage)] mb-1.5">{t('invite.name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('invite.namePlaceholder')}
            className="w-full bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#8FD99A]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--sage)] mb-1.5">
            {t('invite.emailOptional')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#8FD99A]"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-[#8FD99A] bg-[var(--surface-active)] rounded-lg px-3 py-2">{success}</p>
        )}

        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={handleInvite}
          className="w-full py-3.5 rounded-xl bg-[#7BC98A] text-[#040404] font-semibold text-sm hover:bg-[#B7F7AC] transition disabled:opacity-50"
        >
          {busy ? t('invite.sending') : t('invite.send')}
        </button>

        {lastUrl && (
          <div className="flex gap-2">
            <input
              readOnly
              value={lastUrl}
              className="flex-1 bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2 text-[11px] text-[var(--sage)] font-mono truncate"
            />
            <button
              type="button"
              onClick={copyLast}
              className="shrink-0 px-3 py-2 rounded-xl border border-[var(--border-strong)] text-[#8FD99A] text-xs hover:bg-[var(--surface-active)]"
            >
              {t('invite.copyLink')}
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2">
          <h4 className="text-xs uppercase tracking-wider text-[var(--sage)]/80">
            {t('invite.yourCircle')}
          </h4>
          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                { id: 'all' as const, label: t('invite.filterAll') },
                ...INVITE_CATEGORIES.map((c) => ({
                  id: c.id as InviteCategory | 'all',
                  label: categoryLabel(c.id, lang),
                })),
              ] as { id: 'all' | InviteCategory; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`shrink-0 px-2 py-1 rounded-full text-[10px] border transition ${
                  filter === f.id
                    ? 'border-[#8FD99A] text-[#8FD99A] bg-[var(--surface-active)]'
                    : 'border-[var(--border-soft)] text-[var(--sage)]/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-[var(--sage)]/45 leading-relaxed py-2">{t('invite.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-soft)] bg-[#040404]/50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{l.name}</p>
                  <p className="text-[11px] text-[var(--sage)]/55">
                    {relationLabel(l.relation as LinkRelation, lang)}
                    {l.email ? ` · ${l.email}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      l.status === 'connected'
                        ? 'border-[#8FD99A] text-[#8FD99A] bg-[var(--surface-active)]'
                        : 'border-[var(--border-strong)] text-[var(--sage)]'
                    }`}
                  >
                    {l.status === 'invited'
                      ? t('invite.statusInvited')
                      : l.status === 'connected'
                        ? t('invite.connectedBadge')
                        : t('invite.statusPending')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(l.id)}
                    className="text-[11px] text-[var(--sage)]/70 hover:text-red-400"
                    title={t('common.delete')}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
