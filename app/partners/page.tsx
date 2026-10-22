'use client';

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { mapAuthError } from '@/lib/auth/paths';
import { useI18n } from '@/components/I18nProvider';
import LanguageControl from '@/components/settings/LanguageControl';
import BrandLoader from '@/components/ui/BrandLoader';
import { partnerCopy, sendPartnerEvent } from './copy';

const clip = (v: string | null, n = 120) => (v ?? '').trim().slice(0, n);
const ROLES = ['pastor', 'leader', 'member'] as const;

function PartnerForm() {
  const sp = useSearchParams();
  const { lang } = useI18n();
  const c = partnerCopy(lang);
  // CRM prefill: /partners?name=&email=&church=&city=&role=pastor&crm_id=S-IGL-001
  const crmId = clip(sp.get('crm_id') || sp.get('ref'), 40).replace(/[^A-Za-z0-9_-]/g, '');
  const roleParam = clip(sp.get('role'), 16);
  const [name, setName] = useState(clip(sp.get('name')));
  const [email, setEmail] = useState(clip(sp.get('email'), 254));
  const [church, setChurch] = useState(clip(sp.get('church')));
  const [city, setCity] = useState(clip(sp.get('city')));
  const [role, setRole] = useState<string>((ROLES as readonly string[]).includes(roleParam) ? roleParam : 'pastor');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const started = useRef(false);
  const base = {
    crm_id: crmId,
    lang: String(lang),
    prefilled: Boolean(sp.get('email') || sp.get('name')),
    utm_source: clip(sp.get('utm_source'), 64),
    utm_medium: clip(sp.get('utm_medium'), 64),
    utm_campaign: clip(sp.get('utm_campaign'), 64),
  };

  useEffect(() => {
    sendPartnerEvent('partner_view', base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onStart() {
    if (started.current) return;
    started.current = true;
    sendPartnerEvent('partner_start', base);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !church.trim()) return setError(c.errFields);
    if (password.length < 8) return setError(c.errPass);
    if (!terms) return setError(c.errTerms);
    setLoading(true);
    try {
      const supabase = createClient();
      const next = '/partners/welcome';
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            partner: true,
            partner_type: 'church',
            partner_role: role,
            partner_church: church.trim(),
            partner_city: city.trim(),
            partner_crm_id: crmId || null,
            partner_signup_at: new Date().toISOString(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (err) throw err;
      sendPartnerEvent('partner_submit', { ...base, role });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? mapAuthError(err.message, lang) : 'Error');
    } finally {
      setLoading(false);
    }
  }

  const input =
    'w-full rounded-xl bg-[var(--true-black)] border border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--off-white)] focus:outline-none focus:border-[var(--accent)]';

  if (sent) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-[var(--accent)] mb-2">{c.checkTitle}</h2>
        <p className="text-sm text-[var(--sage)]/80">
          {c.checkBody} <span className="text-[var(--off-white)]">{email.trim()}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} onFocus={onStart} className="glass rounded-2xl p-6 space-y-3" noValidate>
      <h2 className="font-display text-lg font-bold text-[var(--accent)]">{c.formTitle}</h2>
      <input className={input} placeholder={c.name} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      <input className={input} type="email" placeholder={c.email} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      <input className={input} placeholder={c.church} value={church} onChange={(e) => setChurch(e.target.value)} required />
      <input className={input} placeholder={c.city} value={city} onChange={(e) => setCity(e.target.value)} />
      <label className="block text-xs text-[var(--sage)]/80">
        {c.role}
        <select className={`${input} mt-1`} value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{c.roles[r]}</option>
          ))}
        </select>
      </label>
      <input className={input} type="password" placeholder={c.password} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
      <label className="flex items-start gap-2 text-xs text-[var(--sage)]/80">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5" />
        <span>
          <Link href="/terms" className="underline">{c.terms}</Link>
        </span>
      </label>
      {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? '…' : c.submit}
      </button>
      <p className="text-xs text-[var(--sage)]/70">{c.note}</p>
    </form>
  );
}

function Hero() {
  const { lang } = useI18n();
  const c = partnerCopy(lang);
  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-wider text-[var(--accent)]">{c.kicker}</p>
      <h1 className="font-display text-3xl font-bold text-[var(--off-white)] leading-tight">{c.title}</h1>
      <p className="text-sm text-[var(--sage)]/90 leading-relaxed">{c.lead}</p>
      <ul className="space-y-2 text-sm text-[var(--off-white)]">
        {c.benefits.map((b) => (
          <li key={b} className="flex gap-2"><span className="text-[var(--accent)]">✓</span>{b}</li>
        ))}
      </ul>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <div className="marketing-shell text-[var(--off-white)] px-5 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Image src="/logo.png" alt="Salvazion" width={48} height={48} className="object-contain" />
          <LanguageControl compact />
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <Hero />
          <Suspense fallback={<BrandLoader />}>
            <PartnerForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
