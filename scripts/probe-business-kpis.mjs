/**
 * Probe Salvazion Inc. business KPI sources (Stripe + Supabase service role).
 * Usage: node scripts/probe-business-kpis.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function loadEnvLocal() {
  const path = '.env.local';
  if (!existsSync(path)) throw new Error('Missing .env.local');
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

function unitToUsd(cents, currency = 'usd') {
  if (cents == null) return 0;
  const c = currency.toLowerCase();
  if (c === 'jpy' || c === 'krw') return cents;
  return cents / 100;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const srk = env.SUPABASE_SERVICE_ROLE_KEY;
  const sk = env.STRIPE_SECRET_KEY;

  console.log('=== Salvazion Inc. KPI probe ===');
  console.log('SUPABASE_URL', url ? 'yes' : 'NO');
  console.log('SERVICE_ROLE', srk ? 'yes' : 'NO');
  console.log('STRIPE_SECRET', sk ? sk.slice(0, 8) + '…' : 'NO');

  const admin = createClient(url, srk, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();

  const [total, onboarded, new7, new30, paid] = await Promise.all([
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
      .select('user_id,status,billing_interval', { count: 'exact' })
      .in('status', ['active', 'trialing', 'past_due']),
  ]);

  console.log('\n--- Supabase ---');
  console.log('profiles total', total.count, total.error?.message || 'ok');
  console.log('onboarded', onboarded.count, onboarded.error?.message || 'ok');
  console.log('new 7d', new7.count, '30d', new30.count);
  console.log(
    'subscriptions paid-ish',
    paid.count,
    paid.error?.message || 'ok',
    paid.data?.slice?.(0, 5)
  );

  try {
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    console.log(
      'auth users total',
      data?.total ?? '(n/a)',
      error?.message || 'ok'
    );
  } catch (e) {
    console.log('auth.admin', e.message);
  }

  console.log('\n--- Stripe ---');
  const stripe = new Stripe(sk);
  let mrr = 0;
  let activeN = 0;
  let monthly = 0;
  let annual = 0;
  let startingAfter;
  for (let page = 0; page < 20; page++) {
    const res = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      starting_after: startingAfter,
      expand: ['data.items.data.price'],
    });
    for (const sub of res.data) {
      activeN += 1;
      for (const item of sub.items.data) {
        const p = item.price;
        if (!p?.unit_amount) continue;
        const amt = unitToUsd(p.unit_amount, p.currency) * (item.quantity || 1);
        const interval = p.recurring?.interval;
        const count = p.recurring?.interval_count || 1;
        if (interval === 'year') {
          mrr += amt / (12 * count);
          annual += 1;
        } else {
          mrr += amt / count;
          monthly += 1;
        }
      }
    }
    if (!res.has_more) break;
    startingAfter = res.data[res.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  const t30 = Math.floor((Date.now() - 30 * 864e5) / 1000);
  let rev30 = 0;
  startingAfter = undefined;
  for (let page = 0; page < 20; page++) {
    const inv = await stripe.invoices.list({
      status: 'paid',
      created: { gte: t30 },
      limit: 100,
      starting_after: startingAfter,
    });
    for (const i of inv.data) rev30 += unitToUsd(i.amount_paid, i.currency);
    if (!inv.has_more) break;
    startingAfter = inv.data[inv.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  console.log('active subs', activeN, 'monthly', monthly, 'annual', annual);
  console.log('MRR', mrr.toFixed(2), 'ARR', (mrr * 12).toFixed(2));
  console.log('revenue 30d', rev30.toFixed(2));

  const accounts = total.count || 0;
  const act = onboarded.count || 0;
  console.log('\n--- Funnel snapshot ---');
  console.log('accounts', accounts);
  console.log('activated', act, accounts ? ((act / accounts) * 100).toFixed(1) + '%' : '—');
  console.log(
    'paying',
    activeN,
    accounts ? ((activeN / accounts) * 100).toFixed(1) + '%' : '—'
  );

  console.log('\n--- X brand (@salvazion_) ---');
  try {
    const xr = await fetch('https://api.fxtwitter.com/salvazion_', {
      headers: { 'User-Agent': 'SalvazionBusiness/1.0' },
    });
    const xj = await xr.json();
    const u = xj.user || {};
    console.log('followers', u.followers, 'tweets', u.tweets, 'verified', u.verification?.verified);
    if (accounts && u.followers) {
      console.log(
        'followers→app',
        ((accounts / u.followers) * 100).toFixed(2) + '%'
      );
    }
  } catch (e) {
    console.log('x fetch fail', e.message);
  }

  console.log('OK');
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
