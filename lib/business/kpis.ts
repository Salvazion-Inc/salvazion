/**
 * Salvazion Inc. business KPIs — revenue, retention, acquisition funnel.
 * Real operator metrics from Stripe + Supabase (service role).
 */

import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_COPY, STRIPE_PRICE_ANNUAL, STRIPE_PRICE_MONTHLY } from '@/lib/billing/plans';
import { fetchXBrandMetrics } from './x-metrics';
import type { BusinessKpis, FunnelStep } from './types';

export type { BusinessKpis, FunnelStep } from './types';

/** Client poll cadence for near real-time console */
export const BUSINESS_POLL_INTERVAL_SEC = 30;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function unitAmountToUsd(
  unitAmount: number | null | undefined,
  currency?: string | null
): number {
  if (unitAmount == null || !Number.isFinite(unitAmount)) return 0;
  const c = (currency || 'usd').toLowerCase();
  if (c === 'jpy' || c === 'krw') return unitAmount;
  return unitAmount / 100;
}

function detectStripeKeyKind(): BusinessKpis['sources']['stripeKeyKind'] {
  const k = process.env.STRIPE_SECRET_KEY?.trim() || '';
  if (!k) return 'none';
  if (k.startsWith('rk_')) return 'restricted';
  if (k.startsWith('sk_')) return 'secret';
  return 'unknown';
}

function mrrFromSubscription(sub: Stripe.Subscription): number {
  if (sub.status !== 'active' && sub.status !== 'past_due') return 0;

  let mrr = 0;
  for (const item of sub.items.data) {
    const price = item.price;
    if (!price || price.unit_amount == null) continue;
    const qty = item.quantity ?? 1;
    const amount = unitAmountToUsd(price.unit_amount, price.currency) * qty;
    const interval = price.recurring?.interval;
    const count = price.recurring?.interval_count || 1;
    if (interval === 'month') mrr += amount / count;
    else if (interval === 'year') mrr += amount / (12 * count);
    else if (interval === 'week') mrr += (amount * 52) / (12 * count);
    else if (interval === 'day') mrr += (amount * 365) / (12 * count);
  }
  return mrr;
}

function priceIdOfSub(sub: Stripe.Subscription): string | null {
  return sub.items.data[0]?.price?.id || null;
}

async function listAllSubscriptions(
  stripe: Stripe,
  status: Stripe.SubscriptionListParams.Status
): Promise<Stripe.Subscription[]> {
  const out: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;
  for (let i = 0; i < 25; i++) {
    const page = await stripe.subscriptions.list({
      status,
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.items.data.price'],
    });
    out.push(...page.data);
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }
  return out;
}

async function countStripeCustomers(stripe: Stripe): Promise<number> {
  let n = 0;
  let startingAfter: string | undefined;
  for (let i = 0; i < 30; i++) {
    const page = await stripe.customers.list({
      limit: 100,
      starting_after: startingAfter,
    });
    n += page.data.length;
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }
  return n;
}

async function sumPaidInvoices(stripe: Stripe, sinceUnix: number): Promise<number> {
  let total = 0;
  let startingAfter: string | undefined;
  for (let i = 0; i < 30; i++) {
    const page = await stripe.invoices.list({
      status: 'paid',
      created: { gte: sinceUnix },
      limit: 100,
      starting_after: startingAfter,
    });
    for (const inv of page.data) {
      total += unitAmountToUsd(inv.amount_paid, inv.currency);
    }
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }
  return total;
}

async function loadSupabaseUserMetrics(): Promise<{
  totalAccounts: number;
  authUsers: number;
  onboardedAccounts: number;
  newAccounts7d: number;
  newAccounts30d: number;
  paidFromDb: number;
  monthlyFromDb: number;
  annualFromDb: number;
  appUsersWithX: number;
  error?: string;
}> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      totalAccounts: 0,
      authUsers: 0,
      onboardedAccounts: 0,
      newAccounts7d: 0,
      newAccounts30d: 0,
      paidFromDb: 0,
      monthlyFromDb: 0,
      annualFromDb: 0,
      appUsersWithX: 0,
      error: 'SUPABASE_SERVICE_ROLE_KEY missing',
    };
  }

  try {
    const since7 = daysAgoIso(7);
    const since30 = daysAgoIso(30);

    const [
      totalRes,
      onboardedRes,
      new7Res,
      new30Res,
      paidRes,
      monthRes,
      yearRes,
      xLinkedRes,
    ] = await Promise.all([
        admin.from('profiles').select('id', { count: 'exact', head: true }),
        admin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('onboarding_completed', true),
        admin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', since7),
        admin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', since30),
        admin
          .from('subscriptions')
          .select('user_id', { count: 'exact', head: true })
          .in('status', ['active', 'trialing', 'past_due']),
        admin
          .from('subscriptions')
          .select('user_id', { count: 'exact', head: true })
          .in('status', ['active', 'past_due'])
          .eq('billing_interval', 'month'),
        admin
          .from('subscriptions')
          .select('user_id', { count: 'exact', head: true })
          .in('status', ['active', 'past_due'])
          .eq('billing_interval', 'year'),
        admin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .not('x_username', 'is', null)
          .neq('x_username', ''),
      ]);

    let authUsers = 0;
    try {
      const { data, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      if (!error) {
        // supabase-js exposes total on some versions
        const total =
          (data as { total?: number })?.total ??
          (typeof data?.users?.length === 'number' ? undefined : undefined);
        if (typeof total === 'number') authUsers = total;
        else {
          // Fallback: page through lightly (cap) if total missing
          let page = 1;
          let n = 0;
          for (; page <= 50; page++) {
            const batch = await admin.auth.admin.listUsers({
              page,
              perPage: 100,
            });
            const len = batch.data?.users?.length ?? 0;
            n += len;
            if (len < 100) break;
          }
          authUsers = n;
        }
      }
    } catch {
      /* optional */
    }

    const err =
      totalRes.error?.message ||
      onboardedRes.error?.message ||
      new7Res.error?.message ||
      new30Res.error?.message ||
      paidRes.error?.message ||
      monthRes.error?.message ||
      yearRes.error?.message ||
      xLinkedRes.error?.message;

    const profiles = totalRes.count ?? 0;

    return {
      totalAccounts: Math.max(profiles, authUsers),
      authUsers: authUsers || profiles,
      onboardedAccounts: onboardedRes.count ?? 0,
      newAccounts7d: new7Res.count ?? 0,
      newAccounts30d: new30Res.count ?? 0,
      paidFromDb: paidRes.count ?? 0,
      monthlyFromDb: monthRes.count ?? 0,
      annualFromDb: yearRes.count ?? 0,
      appUsersWithX: xLinkedRes.count ?? 0,
      error: err || undefined,
    };
  } catch (e) {
    return {
      totalAccounts: 0,
      authUsers: 0,
      onboardedAccounts: 0,
      newAccounts7d: 0,
      newAccounts30d: 0,
      paidFromDb: 0,
      monthlyFromDb: 0,
      annualFromDb: 0,
      appUsersWithX: 0,
      error: e instanceof Error ? e.message : 'supabase_failed',
    };
  }
}

function pct(n: number, d: number): number | null {
  if (!d || d <= 0) return null;
  return Math.round((n / d) * 1000) / 10;
}

function buildFunnel(opts: {
  totalAccounts: number;
  onboardedAccounts: number;
  stripeCustomers: number;
  activeSubscribers: number;
  newPaid30d: number;
}): FunnelStep[] {
  const {
    totalAccounts,
    onboardedAccounts,
    stripeCustomers,
    activeSubscribers,
    newPaid30d,
  } = opts;

  const steps: Omit<FunnelStep, 'convFromPrevPct' | 'convFromTopPct'>[] = [
    {
      id: 'accounts',
      labelEs: 'Cuentas registradas',
      labelEn: 'Registered accounts',
      count: totalAccounts,
      noteEs: 'Usuarios con cuenta (Supabase Auth / profiles).',
      noteEn: 'Users with an account (Supabase Auth / profiles).',
    },
    {
      id: 'activated',
      labelEs: 'Activados (onboarding)',
      labelEn: 'Activated (onboarding)',
      count: onboardedAccounts,
      noteEs: 'Completaron onboarding — listos para valor Premium.',
      noteEn: 'Finished onboarding — ready for Premium value.',
    },
    {
      id: 'billing_identity',
      labelEs: 'Identidad de cobro (Stripe)',
      labelEn: 'Billing identity (Stripe)',
      count: stripeCustomers,
      noteEs: 'Customers en Stripe (checkout / portal).',
      noteEn: 'Stripe customers (checkout / portal).',
    },
    {
      id: 'paying',
      labelEs: 'Clientes de pago activos',
      labelEn: 'Active paying customers',
      count: activeSubscribers,
      noteEs: 'Suscripciones active o past_due en Stripe.',
      noteEn: 'Active or past_due Stripe subscriptions.',
    },
    {
      id: 'new_paid_30d',
      labelEs: 'Nuevos de pago (30 días)',
      labelEn: 'New paid (30 days)',
      count: newPaid30d,
      noteEs: 'Altas de suscripción en 30 días (adquisición de pago).',
      noteEn: 'Subscription starts in 30 days (paid acquisition).',
    },
  ];

  const top = steps[0]?.count || 0;
  return steps.map((s, i) => {
    const prev = i === 0 ? null : steps[i - 1].count;
    return {
      ...s,
      convFromPrevPct: prev == null ? null : pct(s.count, prev),
      convFromTopPct: pct(s.count, top),
    };
  });
}

function buildInsights(k: {
  mrr: number;
  activeSubscribers: number;
  totalAccounts: number;
  onboardedAccounts: number;
  stripeCustomers: number;
  activationPct: number | null;
  paidConversionPct: number | null;
  canceled30d: number;
  followers: number | null;
  appUsersWithX: number;
  sources: BusinessKpis['sources'];
}): { es: string; en: string }[] {
  const out: { es: string; en: string }[] = [];

  if (k.mrr === 0 && k.activeSubscribers === 0) {
    out.push({
      es: 'Sin MRR todavía: no hay suscripciones Premium activas. Prioridad: convertir activados → checkout Stripe.',
      en: 'No MRR yet: zero active Premium subscriptions. Priority: convert activated users → Stripe checkout.',
    });
  }

  if (k.followers != null && k.followers > 0 && k.totalAccounts > 0) {
    const ratio = k.totalAccounts / k.followers;
    const pctR = Math.round(ratio * 10000) / 100;
    out.push({
      es: `Alcance X: ${k.followers.toLocaleString()} followers → ${k.totalAccounts} cuentas app (${pctR}% de conversión social→producto).`,
      en: `X reach: ${k.followers.toLocaleString()} followers → ${k.totalAccounts} app accounts (${pctR}% social→product conversion).`,
    });
  }

  if (k.appUsersWithX > 0) {
    out.push({
      es: `${k.appUsersWithX} cuenta(s) con X vinculado — canal de identidad social activo.`,
      en: `${k.appUsersWithX} account(s) with X linked — social identity channel active.`,
    });
  }

  if (k.totalAccounts > 0 && (k.activationPct ?? 0) < 70) {
    out.push({
      es: `Activación en ${k.activationPct ?? 0}% (${k.onboardedAccounts}/${k.totalAccounts}). Mejorar onboarding reduce fricción al pago.`,
      en: `Activation at ${k.activationPct ?? 0}% (${k.onboardedAccounts}/${k.totalAccounts}). Better onboarding reduces friction to pay.`,
    });
  }

  if (k.stripeCustomers > k.activeSubscribers) {
    out.push({
      es: `${k.stripeCustomers} customers en Stripe vs ${k.activeSubscribers} de pago: hay identidades de cobro sin suscripción activa (abandono de checkout o cancelados).`,
      en: `${k.stripeCustomers} Stripe customers vs ${k.activeSubscribers} paying: billing identities without active sub (checkout abandon or canceled).`,
    });
  }

  if (k.canceled30d > 0) {
    out.push({
      es: `${k.canceled30d} cancelaciones en 30 días — revisar causa (precio, valor percibido, fallos de cobro).`,
      en: `${k.canceled30d} cancellations in 30 days — review why (price, perceived value, failed payments).`,
    });
  }

  if (k.sources.stripeKeyKind === 'restricted') {
    out.push({
      es: 'Clave Stripe restricted (rk_): OK para suscripciones/facturas/customers si los permisos están abiertos. Balance no es necesario para este panel.',
      en: 'Restricted Stripe key (rk_): OK for subscriptions/invoices/customers when permissions allow. Balance is not required for this console.',
    });
  }

  if (!k.sources.stripe) {
    out.push({
      es: 'Stripe no configurado — no hay verdad de ingresos.',
      en: 'Stripe not configured — no revenue truth.',
    });
  }

  if (!k.sources.supabase) {
    out.push({
      es: 'Supabase service role ausente — embudo de cuentas incompleto.',
      en: 'Supabase service role missing — account funnel incomplete.',
    });
  }

  if (out.length === 0) {
    out.push({
      es: 'Embudo y caja alineados. Sostener retención y subir % anual (mejor LTV).',
      en: 'Funnel and cash aligned. Defend retention and grow annual share (better LTV).',
    });
  }

  return out;
}

/**
 * Aggregate Salvazion Inc. business KPIs from Stripe + Supabase + X brand.
 * Near real-time: no long cache; X metrics TTL ~25s inside fetchXBrandMetrics.
 */
export async function computeBusinessKpis(opts?: {
  forceX?: boolean;
}): Promise<BusinessKpis> {
  const t0 = Date.now();
  const sources: BusinessKpis['sources'] = {
    stripe: isStripeConfigured(),
    supabase: Boolean(createAdminClient()),
    x: false,
    stripeKeyKind: detectStripeKeyKind(),
  };

  let mrr = 0;
  let activeSubscribers = 0;
  let monthlySubs = 0;
  let annualSubs = 0;
  let trialing = 0;
  let pastDue = 0;
  let canceled30d = 0;
  let newPaid30d = 0;
  let newPaid7d = 0;
  let revenue30d = 0;
  let revenue7d = 0;
  let stripeCustomers = 0;

  if (sources.stripe) {
    try {
      const stripe = getStripe();
      const [active, trial, past, canceled, customers] = await Promise.all([
        listAllSubscriptions(stripe, 'active'),
        listAllSubscriptions(stripe, 'trialing'),
        listAllSubscriptions(stripe, 'past_due'),
        listAllSubscriptions(stripe, 'canceled'),
        countStripeCustomers(stripe),
      ]);

      stripeCustomers = customers;
      const now = Date.now();
      const t7 = now - 7 * 86400000;
      const t30 = now - 30 * 86400000;

      const payingPool = [...active, ...past];
      activeSubscribers = payingPool.length;
      pastDue = past.length;
      trialing = trial.length;

      for (const sub of payingPool) {
        mrr += mrrFromSubscription(sub);
        const pid = priceIdOfSub(sub);
        if (pid === STRIPE_PRICE_ANNUAL) annualSubs += 1;
        else if (pid === STRIPE_PRICE_MONTHLY) monthlySubs += 1;
        else {
          const interval = sub.items.data[0]?.price?.recurring?.interval;
          if (interval === 'year') annualSubs += 1;
          else monthlySubs += 1;
        }

        const createdMs = (sub.created || 0) * 1000;
        if (createdMs >= t30) newPaid30d += 1;
        if (createdMs >= t7) newPaid7d += 1;
      }

      for (const sub of canceled) {
        const canceledAt = (sub.canceled_at || sub.ended_at || 0) * 1000;
        if (canceledAt >= t30) canceled30d += 1;
      }

      const [rev30, rev7] = await Promise.all([
        sumPaidInvoices(stripe, Math.floor(t30 / 1000)),
        sumPaidInvoices(stripe, Math.floor(t7 / 1000)),
      ]);
      revenue30d = rev30;
      revenue7d = rev7;
    } catch (e) {
      sources.stripeError = e instanceof Error ? e.message : 'stripe_failed';
    }
  } else {
    sources.stripeError = 'STRIPE_SECRET_KEY missing';
  }

  const [users, xBrand] = await Promise.all([
    loadSupabaseUserMetrics(),
    fetchXBrandMetrics({ force: opts?.forceX }),
  ]);
  if (users.error) sources.supabaseError = users.error;
  sources.x = Boolean(
    xBrand.source === 'fxtwitter' || xBrand.source === 'x_api_v2'
  );
  if (xBrand.error) sources.xError = xBrand.error;

  // Fallback to DB if Stripe empty due to error
  if (activeSubscribers === 0 && users.paidFromDb > 0 && sources.stripeError) {
    activeSubscribers = users.paidFromDb;
    monthlySubs = users.monthlyFromDb;
    annualSubs = users.annualFromDb;
    mrr =
      users.monthlyFromDb * PLAN_COPY.premium_month.priceUsd +
      users.annualFromDb * (PLAN_COPY.premium_year.priceUsd / 12);
  }

  const arr = mrr * 12;
  const arpu = activeSubscribers > 0 ? mrr / activeSubscribers : 0;
  const startBase = activeSubscribers + canceled30d;
  const churnRate30dPct =
    startBase > 0 ? Math.round((canceled30d / startBase) * 1000) / 10 : null;
  const ltv =
    arpu > 0 && churnRate30dPct != null && churnRate30dPct > 0
      ? Math.round((arpu / (churnRate30dPct / 100)) * 100) / 100
      : null;

  const activationPct = pct(users.onboardedAccounts, users.totalAccounts);
  const paidConversionPct = pct(activeSubscribers, users.totalAccounts);
  const paidOfActivatedPct = pct(activeSubscribers, users.onboardedAccounts);
  const billingIdentityPct = pct(stripeCustomers, users.totalAccounts);
  const followersToAccountsPct =
    xBrand.followers != null && xBrand.followers > 0
      ? pct(users.totalAccounts, xBrand.followers)
      : null;

  const funnel = buildFunnel({
    totalAccounts: users.totalAccounts,
    onboardedAccounts: users.onboardedAccounts,
    stripeCustomers,
    activeSubscribers,
    newPaid30d,
  });

  const base = {
    mrr: Math.round(mrr * 100) / 100,
    activeSubscribers,
    totalAccounts: users.totalAccounts,
    onboardedAccounts: users.onboardedAccounts,
    stripeCustomers,
    activationPct,
    paidConversionPct,
    canceled30d,
    followers: xBrand.followers,
    appUsersWithX: users.appUsersWithX,
    sources,
  };

  return {
    asOf: new Date().toISOString(),
    computeMs: Date.now() - t0,
    pollIntervalSec: BUSINESS_POLL_INTERVAL_SEC,
    live: true,
    currency: 'USD',
    mrr: base.mrr,
    arr: Math.round(arr * 100) / 100,
    revenue30d: Math.round(revenue30d * 100) / 100,
    revenue7d: Math.round(revenue7d * 100) / 100,
    arpu: Math.round(arpu * 100) / 100,
    ltv,
    activeSubscribers,
    monthlySubs,
    annualSubs,
    trialing,
    pastDue,
    canceled30d,
    newPaid30d,
    newPaid7d,
    churnRate30dPct,
    stripeCustomers,
    totalAccounts: users.totalAccounts,
    authUsers: users.authUsers,
    onboardedAccounts: users.onboardedAccounts,
    newAccounts7d: users.newAccounts7d,
    newAccounts30d: users.newAccounts30d,
    paidConversionPct,
    activationPct,
    paidOfActivatedPct,
    billingIdentityPct,
    funnel,
    x: {
      handle: xBrand.handle,
      url: xBrand.url,
      name: xBrand.name,
      followers: xBrand.followers,
      following: xBrand.following,
      tweets: xBrand.tweets,
      mediaCount: xBrand.mediaCount,
      likes: xBrand.likes,
      verified: xBrand.verified,
      articlesCatalog: xBrand.articlesCatalog,
      articlesLast30d: xBrand.articlesLast30d,
      appUsersWithX: users.appUsersWithX,
      followersToAccountsPct,
      source: xBrand.source,
      fetchedAt: xBrand.fetchedAt,
      latencyMs: xBrand.latencyMs,
      error: xBrand.error,
    },
    sources,
    planPrices: {
      monthlyUsd: PLAN_COPY.premium_month.priceUsd,
      annualUsd: PLAN_COPY.premium_year.priceUsd,
      annualMonthlyEquivalent: PLAN_COPY.premium_year.monthlyEquivalent,
    },
    insights: buildInsights(base),
  };
}
