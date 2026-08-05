# Salvazion Inc. — Business KPIs & funnel

Operator console for **real business metrics** (not app vanity).

## Access

- Route: `/hub/business`
- API: `GET /api/business/kpis`
- **Only** `info@salvazion.org` (optional extras via `BUSINESS_ADMIN_EMAILS` comma-list)
- Other signed-in users receive **403**; signed-out **401**

## Sources of truth

| Source | Metrics |
|--------|---------|
| **Stripe** | MRR, ARR, ARPU, paid invoices 7d/30d, active/trial/past_due, cancel 30d, customers |
| **Supabase** (service role) | profiles, onboarding, new accounts, X-linked users, subscriptions fallback |
| **X (@salvazion_)** | followers, posts, media, likes, verified; articles catalog (+ last 30d); social→app % |

### Real-time

- API: `Cache-Control: no-store`
- X metrics cached ~25s server-side (use `?fresh=1` to bust)
- UI polls every **30s** while the tab is visible; pauses when hidden; resumes on focus

### X env (optional)

```
X_BEARER_TOKEN=…          # official API v2 (preferred when available)
# TWITTER_BEARER_TOKEN=…  # alias
```

Without a bearer token, the console uses a live public profile feed for brand metrics.

## Env required

```
STRIPE_SECRET_KEY=sk_live_… or rk_live_… (needs Subscriptions + Invoices + Customers read)
SUPABASE_SERVICE_ROLE_KEY=…
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=…
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=…
# optional
BUSINESS_ADMIN_EMAILS=other@salvazion.org
```

## Verify

```bash
node scripts/probe-business-kpis.mjs
```

## Funnel stages

1. Registered accounts  
2. Activated (onboarding completed)  
3. Stripe billing identity (customers)  
4. Active paying customers  
5. New paid last 30 days  

## Notes

- Restricted keys (`rk_`) work if permissions include the resources above; **Balance** is not required.
- Zero MRR with accounts is a valid early-stage state — the console shows operator insights.
