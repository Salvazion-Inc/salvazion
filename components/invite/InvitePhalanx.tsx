'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LinkRelation, LinkedProfile, UserProfile } from '@/lib/types';
import {
  INVITE_CATEGORIES,
  categoryHint,
  categoryLabel,
  createInvite,
  listAllLinks,
  relationLabel,
  removeLink,
  shareInviteText,
  type InviteCategory,
} from '@/lib/invite/engine';
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

  const refresh = useCallback(async () => {
    const p = await loadProfileAsync();
    setProfileName(p.name || '');
    const all = listAllLinks(p);
    setLinks(all);
    onChanged?.(all);
  }, [onChanged]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
          <p className="text-xs uppercase tracking-wider text-[#B7F7AC]/60">Phalanx</p>
          <h3 className="text-base font-semibold text-[#00F511] mt-0.5">{t('invite.title')}</h3>
          <p className="text-xs text-[#B7F7AC]/55 mt-1 leading-relaxed">{t('invite.subtitle')}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full border border-[#00F511]/30 text-[#00F511] shrink-0">
          {links.length} {t('invite.count')}
        </span>
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
                  ? 'border-[#00F511] bg-[#00F511]/12 shadow-[0_0_16px_rgba(0,245,17,0.12)]'
                  : 'border-[#00B10C]/30 hover:border-[#00F511]/40'
              }`}
            >
              <div className="text-xl mb-1">{c.icon}</div>
              <div className={`text-sm font-semibold ${active ? 'text-[#00F511]' : 'text-white'}`}>
                {categoryLabel(c.id, lang)}
              </div>
              <div className="text-[10px] text-[#B7F7AC]/50 leading-snug mt-0.5">
                {categoryHint(c.id, lang)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <div className="space-y-3 rounded-xl border border-[#00B10C]/25 bg-[#040404]/40 p-4">
        <p className="text-[11px] text-[#B7F7AC]/60">
          {t('invite.invitingAs')}{' '}
          <span className="text-[#00F511] font-medium">
            {relationLabel(catDef.relation, lang)}
          </span>
        </p>
        <div>
          <label className="block text-xs text-[#B7F7AC] mb-1.5">{t('invite.name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('invite.namePlaceholder')}
            className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00F511]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#B7F7AC] mb-1.5">
            {t('invite.emailOptional')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#00F511]"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-[#00F511] bg-[#00F511]/10 rounded-lg px-3 py-2">{success}</p>
        )}

        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={handleInvite}
          className="w-full py-3.5 rounded-xl bg-[#00F511] text-[#040404] font-semibold text-sm hover:bg-[#B7F7AC] transition disabled:opacity-50"
        >
          {busy ? t('invite.sending') : t('invite.send')}
        </button>

        {lastUrl && (
          <div className="flex gap-2">
            <input
              readOnly
              value={lastUrl}
              className="flex-1 bg-[#040404] border border-[#00B10C]/30 rounded-xl px-3 py-2 text-[11px] text-[#B7F7AC]/70 font-mono truncate"
            />
            <button
              type="button"
              onClick={copyLast}
              className="shrink-0 px-3 py-2 rounded-xl border border-[#00F511]/40 text-[#00F511] text-xs hover:bg-[#00F511]/10"
            >
              {t('invite.copyLink')}
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2">
          <h4 className="text-xs uppercase tracking-wider text-[#B7F7AC]/50">
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
                    ? 'border-[#00F511] text-[#00F511] bg-[#00F511]/10'
                    : 'border-[#00B10C]/25 text-[#B7F7AC]/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-[#B7F7AC]/45 leading-relaxed py-2">{t('invite.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#00B10C]/20 bg-[#040404]/50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{l.name}</p>
                  <p className="text-[11px] text-[#B7F7AC]/55">
                    {relationLabel(l.relation as LinkRelation, lang)}
                    {l.email ? ` · ${l.email}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#00F511]/30 text-[#B7F7AC]">
                    {l.status === 'invited'
                      ? t('invite.statusInvited')
                      : l.status === 'connected'
                        ? t('invite.statusConnected')
                        : t('invite.statusPending')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(l.id)}
                    className="text-[11px] text-[#B7F7AC]/40 hover:text-red-400"
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
