'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { isBusinessAdminEmail } from '@/lib/business/access';
import type { BusinessKpis, FunnelStep } from '@/lib/business/types';
import { useI18n } from '@/components/I18nProvider';

const DEFAULT_POLL_SEC = 30;

function money(n: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: n >= 1000 ? 0 : 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function num(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat().format(n);
}

function pctLabel(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n}%`;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'error'; message: string }
  | { status: 'ok'; kpis: BusinessKpis; admin: string };

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 min-w-0 ${
        accent
          ? 'border-[var(--border-strong)] bg-[var(--surface-active)]'
          : 'border-[var(--border-soft)] bg-[var(--surface)]/40'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/75 leading-snug">
        {label}
      </p>
      <p
        className={`text-xl font-bold tabular-nums mt-1 leading-none ${
          accent ? 'text-[#8FD99A]' : 'text-white'
        }`}
      >
        {value}
      </p>
      {sub ? (
        <p className="text-[10px] text-[var(--sage)]/70 mt-1.5 leading-snug">{sub}</p>
      ) : null}
    </div>
  );
}

function FunnelVisual({ steps, es }: { steps: FunnelStep[]; es: boolean }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const widthPct = Math.max(8, Math.round((s.count / max) * 100));
        return (
          <div key={s.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-white">
                {i + 1}. {es ? s.labelEs : s.labelEn}
              </p>
              <p className="text-sm font-bold tabular-nums text-[#8FD99A] shrink-0">
                {num(s.count)}
              </p>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${widthPct}%`,
                  background:
                    'linear-gradient(90deg, #5a9e68 0%, #8FD99A 55%, #b7f7ac 100%)',
                }}
              />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--sage)]/75">
              {s.convFromPrevPct != null ? (
                <span>
                  {es ? 'vs paso ant.' : 'vs prev'}: {s.convFromPrevPct}%
                </span>
              ) : null}
              {s.convFromTopPct != null ? (
                <span>
                  {es ? 'desde tope' : 'from top'}: {s.convFromTopPct}%
                </span>
              ) : null}
            </div>
            {(es ? s.noteEs : s.noteEn) ? (
              <p className="text-[10px] text-[var(--sage)]/60 leading-relaxed">
                {es ? s.noteEs : s.noteEn}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function LiveDot({ live, es }: { live: boolean; es: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] tabular-nums">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          live ? 'bg-[#8FD99A] animate-pulse' : 'bg-[var(--sage)]/50'
        }`}
        aria-hidden
      />
      <span className={live ? 'text-[#8FD99A]' : 'text-[var(--sage)]'}>
        {live ? (es ? 'EN VIVO' : 'LIVE') : es ? 'Pausa' : 'Paused'}
      </span>
    </span>
  );
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const es = lang !== 'en';
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [live, setLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollSecRef = useRef(DEFAULT_POLL_SEC);
  const silentRef = useRef(false);

  const load = useCallback(async (opts?: { fresh?: boolean; silent?: boolean }) => {
    if (!opts?.silent) setState((s) => (s.status === 'ok' ? s : { status: 'loading' }));
    if (opts?.silent) setRefreshing(true);
    silentRef.current = !!opts?.silent;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isBusinessAdminEmail(user.email)) {
        setState({ status: 'denied' });
        return;
      }

      const q = opts?.fresh ? '?fresh=1' : '';
      const res = await fetch(`/api/business/kpis${q}`, { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        setState({ status: 'denied' });
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok || !json.kpis) {
        if (!opts?.silent) {
          setState({
            status: 'error',
            message: json.message || json.error || 'Failed to load KPIs',
          });
        }
        return;
      }
      const kpis = json.kpis as BusinessKpis;
      if (kpis.pollIntervalSec && kpis.pollIntervalSec >= 15) {
        pollSecRef.current = kpis.pollIntervalSec;
      }
      setState({ status: 'ok', kpis, admin: json.admin });
      setLastRefresh(new Date().toISOString());
    } catch (e) {
      if (!opts?.silent) {
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : 'Failed',
        });
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void load({ fresh: true });
  }, [load]);

  // Real-time poll + resume on visibility
  useEffect(() => {
    if (state.status === 'denied') return;

    const tick = () => {
      if (!live) return;
      if (document.visibilityState === 'hidden') return;
      void load({ silent: true });
    };

    const id = window.setInterval(tick, pollSecRef.current * 1000);

    const onVis = () => {
      if (document.visibilityState === 'visible' && live) {
        void load({ silent: true, fresh: true });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, [load, live, state.status]);

  useEffect(() => {
    if (state.status === 'denied') {
      const t = window.setTimeout(() => router.replace('/hub/dashboard'), 2000);
      return () => window.clearTimeout(t);
    }
  }, [state.status, router]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3">
        <div className="skeleton-pulse w-12 h-12 rounded-full" aria-hidden />
        <p className="text-[var(--accent)] text-sm">
          {es ? 'Cargando KPIs en vivo…' : 'Loading live KPIs…'}
        </p>
      </div>
    );
  }

  if (state.status === 'denied') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center gap-2">
        <p className="text-white font-semibold">
          {es ? 'Acceso restringido' : 'Restricted access'}
        </p>
        <p className="text-sm text-[var(--sage)] max-w-sm">
          {es
            ? 'Este panel es solo para el operador de Salvazion Inc. (info@salvazion.org).'
            : 'This console is only for the Salvazion Inc. operator (info@salvazion.org).'}
        </p>
        <Link href="/hub/dashboard" className="text-[var(--accent)] text-sm mt-2">
          ← {es ? 'Volver al hub' : 'Back to hub'}
        </Link>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-red-400 text-sm">{state.message}</p>
        <button
          type="button"
          className="btn-secondary btn-inline text-sm"
          onClick={() => void load({ fresh: true })}
        >
          {es ? 'Reintentar' : 'Retry'}
        </button>
        <Link href="/hub/dashboard" className="text-[var(--sage)] text-sm">
          ← Dashboard
        </Link>
      </div>
    );
  }

  const k = state.kpis;
  const x = k.x;
  const asOf = (() => {
    try {
      return new Date(lastRefresh || k.asOf).toLocaleString(es ? 'es' : 'en', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch {
      return lastRefresh || k.asOf;
    }
  })();

  return (
    <div className="min-h-[100dvh] text-[var(--off-white)] flex flex-col">
      <header className="px-5 pt-6 pb-3 border-b border-[var(--border-soft)]">
        <div className="max-w-lg mx-auto w-full">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href="/hub/dashboard"
                className="text-[10px] text-[var(--sage)] hover:text-[var(--accent)]"
              >
                ← Hub
              </Link>
              <h1 className="text-lg font-bold text-[#8FD99A] mt-1">
                {es ? 'Salvazion Inc. · Negocio' : 'Salvazion Inc. · Business'}
              </h1>
              <p className="text-[10px] text-[var(--sage)]/80 mt-0.5">
                {es
                  ? 'KPI en tiempo real · Stripe · App · X'
                  : 'Real-time KPIs · Stripe · App · X'}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                <LiveDot live={live && !refreshing} es={es} />
                <span className="text-[10px] text-[var(--sage)]/60 truncate">
                  {state.admin}
                </span>
                <span className="text-[10px] text-[var(--sage)]/50 tabular-nums">
                  {asOf}
                  {k.computeMs != null ? ` · ${k.computeMs}ms` : ''}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0 items-end">
              <button
                type="button"
                onClick={() => void load({ fresh: true, silent: true })}
                disabled={refreshing}
                className="btn-outline-sm"
              >
                {refreshing
                  ? es
                    ? '…'
                    : '…'
                  : es
                    ? 'Actualizar'
                    : 'Refresh'}
              </button>
              <button
                type="button"
                onClick={() => setLive((v) => !v)}
                className="text-[10px] text-[var(--sage)] hover:text-[var(--accent)]"
              >
                {live
                  ? es
                    ? `Auto ${k.pollIntervalSec || DEFAULT_POLL_SEC}s · pausar`
                    : `Auto ${k.pollIntervalSec || DEFAULT_POLL_SEC}s · pause`
                  : es
                    ? 'Reanudar auto'
                    : 'Resume auto'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-28 max-w-lg mx-auto w-full space-y-5">
        {k.insights?.length > 0 && (
          <section className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-active)]/60 px-3.5 py-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
              {es ? 'Lectura de operador' : 'Operator read'}
            </p>
            {k.insights.map((ins, i) => (
              <p
                key={i}
                className="text-[11px] text-[var(--off-white)]/90 leading-relaxed"
              >
                • {es ? ins.es : ins.en}
              </p>
            ))}
          </section>
        )}

        {/* X brand — business distribution */}
        <section>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--sage)]">
              {es ? 'X · marca & distribución' : 'X · brand & distribution'}
            </h2>
            <a
              href={x.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[var(--accent)] hover:underline"
            >
              @{x.handle} ↗
            </a>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <KpiCard
              accent
              label={es ? 'Followers' : 'Followers'}
              value={num(x.followers)}
              sub={
                es
                  ? 'Alcance de marca (tope de embudo)'
                  : 'Brand reach (funnel top)'
              }
            />
            <KpiCard
              label={es ? 'Followers → app' : 'Followers → app'}
              value={pctLabel(x.followersToAccountsPct)}
              sub={
                es
                  ? 'Conversión social → producto'
                  : 'Social → product conversion'
              }
            />
            <KpiCard
              label={es ? 'Posts (total)' : 'Posts (total)'}
              value={num(x.tweets)}
              sub={
                es
                  ? `Media ${num(x.mediaCount)} · likes ${num(x.likes)}`
                  : `Media ${num(x.mediaCount)} · likes ${num(x.likes)}`
              }
            />
            <KpiCard
              label={es ? 'X Articles' : 'X Articles'}
              value={num(x.articlesCatalog)}
              sub={
                es
                  ? `+${num(x.articlesLast30d)} en 30d (catálogo app)`
                  : `+${num(x.articlesLast30d)} in 30d (app catalog)`
              }
            />
            <KpiCard
              label={es ? 'App + X vinculado' : 'App + X linked'}
              value={num(x.appUsersWithX)}
              sub={
                es
                  ? 'Cuentas con identidad X'
                  : 'Accounts with X identity'
              }
            />
            <KpiCard
              label={es ? 'Fuente X' : 'X source'}
              value={x.source === 'x_api_v2' ? 'API v2' : x.source === 'fxtwitter' ? 'Live' : x.source}
              sub={
                x.latencyMs != null
                  ? `${x.latencyMs}ms${x.verified ? (es ? ' · verificado' : ' · verified') : ''}`
                  : x.error || '—'
              }
            />
          </div>
        </section>

        {/* Revenue */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--sage)] mb-2.5">
            {es ? 'Ingresos y run-rate' : 'Revenue & run-rate'}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <KpiCard
              accent
              label="MRR"
              value={money(k.mrr, k.currency)}
              sub={es ? 'Ingreso recurrente mensual' : 'Monthly recurring revenue'}
            />
            <KpiCard
              accent
              label="ARR"
              value={money(k.arr, k.currency)}
              sub={es ? 'MRR × 12 (run-rate)' : 'MRR × 12 (run-rate)'}
            />
            <KpiCard
              label={es ? 'Cobrado 30d' : 'Collected 30d'}
              value={money(k.revenue30d, k.currency)}
              sub={es ? 'Facturas Stripe pagadas' : 'Paid Stripe invoices'}
            />
            <KpiCard
              label={es ? 'Cobrado 7d' : 'Collected 7d'}
              value={money(k.revenue7d, k.currency)}
              sub={es ? 'Caja reciente' : 'Recent cash'}
            />
            <KpiCard
              label="ARPU"
              value={money(k.arpu, k.currency)}
              sub={es ? 'MRR / clientes de pago' : 'MRR / paying customers'}
            />
            <KpiCard
              label="LTV"
              value={k.ltv != null ? money(k.ltv, k.currency) : '—'}
              sub={
                es
                  ? 'ARPU ÷ churn mens. (aprox.)'
                  : 'ARPU ÷ mo. churn (approx.)'
              }
            />
          </div>
          <p className="text-[10px] text-[var(--sage)]/65 mt-2 px-0.5">
            {es
              ? `Catálogo: $${k.planPrices.monthlyUsd}/mes · anual $${k.planPrices.annualUsd} (≈$${k.planPrices.annualMonthlyEquivalent}/mes)`
              : `Catalog: $${k.planPrices.monthlyUsd}/mo · annual $${k.planPrices.annualUsd} (≈$${k.planPrices.annualMonthlyEquivalent}/mo)`}
          </p>
        </section>

        {/* Subscriptions */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--sage)] mb-2.5">
            {es ? 'Salud de suscripciones' : 'Subscription health'}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <KpiCard
              accent
              label={es ? 'Clientes de pago' : 'Paying customers'}
              value={num(k.activeSubscribers)}
              sub={`${num(k.monthlySubs)} mo · ${num(k.annualSubs)} yr`}
            />
            <KpiCard
              label={es ? 'Nuevos pago 30d' : 'New paid 30d'}
              value={num(k.newPaid30d)}
              sub={`${es ? '7d' : '7d'}: ${num(k.newPaid7d)}`}
            />
            <KpiCard
              label={es ? 'Cancelados 30d' : 'Canceled 30d'}
              value={num(k.canceled30d)}
              sub={`${es ? 'Churn' : 'Churn'} ~ ${pctLabel(k.churnRate30dPct)}`}
            />
            <KpiCard
              label={es ? 'Trial / past due' : 'Trial / past due'}
              value={`${num(k.trialing)} / ${num(k.pastDue)}`}
              sub={es ? 'Pipeline y riesgo de cobro' : 'Pipeline & collection risk'}
            />
          </div>
        </section>

        {/* Acquisition */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--sage)] mb-2.5">
            {es ? 'Adquisición → conversión' : 'Acquisition → conversion'}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <KpiCard
              label={es ? 'Cuentas' : 'Accounts'}
              value={num(k.totalAccounts)}
              sub={
                es
                  ? `Auth ${num(k.authUsers)} · +${num(k.newAccounts7d)} 7d · +${num(k.newAccounts30d)} 30d`
                  : `Auth ${num(k.authUsers)} · +${num(k.newAccounts7d)} 7d · +${num(k.newAccounts30d)} 30d`
              }
            />
            <KpiCard
              label={es ? 'Activados' : 'Activated'}
              value={num(k.onboardedAccounts)}
              sub={`${es ? 'Activación' : 'Activation'} ${pctLabel(k.activationPct)}`}
            />
            <KpiCard
              label={es ? 'Customers Stripe' : 'Stripe customers'}
              value={num(k.stripeCustomers)}
              sub={`${es ? 'vs cuentas' : 'vs accounts'} ${pctLabel(k.billingIdentityPct)}`}
            />
            <KpiCard
              label={es ? 'Pago / activados' : 'Paid / activated'}
              value={pctLabel(k.paidOfActivatedPct)}
              sub={`${es ? 'Pago/cuentas' : 'Paid/accounts'} ${pctLabel(k.paidConversionPct)}`}
            />
          </div>
        </section>

        {/* Funnel */}
        <section className="card-soft p-4 border border-[var(--border-soft)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--sage)] mb-1">
            {es ? 'Funnel de negocio' : 'Business funnel'}
          </h2>
          <p className="text-[10px] text-[var(--sage)]/70 mb-4 leading-relaxed">
            {es
              ? 'Registro → activación → identidad de cobro → cliente de pago → altas 30d. X aporta el tope de embudo (followers → app).'
              : 'Signup → activation → billing identity → paying customer → new paid 30d. X feeds the funnel top (followers → app).'}
          </p>
          <FunnelVisual steps={k.funnel} es={es} />
        </section>

        {/* Sources */}
        <section className="rounded-xl border border-[var(--border-soft)] px-3.5 py-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
            {es ? 'Fuentes en vivo' : 'Live sources'}
          </p>
          <p className="text-[11px] text-[var(--off-white)]/85 leading-relaxed">
            <span className={k.sources.stripe ? 'text-[#8FD99A]' : 'text-red-400'}>
              Stripe {k.sources.stripe ? '✓' : '✗'}
            </span>
            <span className="text-[var(--sage)]"> · {k.sources.stripeKeyKind}</span>
            {k.sources.stripeError ? (
              <span className="text-[var(--sage)]"> — {k.sources.stripeError}</span>
            ) : null}
          </p>
          <p className="text-[11px] text-[var(--off-white)]/85 leading-relaxed">
            <span
              className={k.sources.supabase ? 'text-[#8FD99A]' : 'text-red-400'}
            >
              Supabase {k.sources.supabase ? '✓' : '✗'}
            </span>
            {k.sources.supabaseError ? (
              <span className="text-[var(--sage)]"> — {k.sources.supabaseError}</span>
            ) : null}
          </p>
          <p className="text-[11px] text-[var(--off-white)]/85 leading-relaxed">
            <span className={k.sources.x ? 'text-[#8FD99A]' : 'text-red-400'}>
              X @{x.handle} {k.sources.x ? '✓' : '✗'}
            </span>
            <span className="text-[var(--sage)]"> · {x.source}</span>
            {k.sources.xError ? (
              <span className="text-[var(--sage)]"> — {k.sources.xError}</span>
            ) : null}
          </p>
          <p className="text-[10px] text-[var(--sage)]/65 leading-relaxed pt-1">
            {es
              ? `Auto-refresh cada ${k.pollIntervalSec || DEFAULT_POLL_SEC}s (pausa al ocultar pestaña). Confidencial: solo info@salvazion.org.`
              : `Auto-refresh every ${k.pollIntervalSec || DEFAULT_POLL_SEC}s (pauses when tab hidden). Confidential: info@salvazion.org only.`}
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
