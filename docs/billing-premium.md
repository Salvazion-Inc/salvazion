# Salvazion Premium (Stripe)

Freemium app with **Premium** subscription on the **Salvazion, Inc.** Stripe account (`acct_1T3hCIHOw5ZkjRlZ`).

## Pricing

| Plan | Price |
|------|--------|
| Free | $0 |
| Premium Monthly | **$49 / month** |
| Premium Annual | **$39 / month** equivalent (**$468 / year**) |

### Stripe objects (live)

- Product: `prod_UxwcMVMNlKeczI` — *Salvazion Premium*
- Monthly price: `price_1U0WEWHOw5ZkjRlZHXRW0gAX` (`salvazion_premium_monthly_49`) → **$49**
- Annual price: `price_1U0WEXHOw5ZkjRlZOwkxysed` (`salvazion_premium_annual_39`) → **$468**
- Legacy $20 monthly `price_1Ty0isHOw5ZkjRlZ6t5TRGje` is still the product `default_price`. **Checkout never charges it.**

Checkout (`/api/billing/checkout`) resolves line items by **lookup_key**, not `default_price` and not a stale `NEXT_PUBLIC_STRIPE_PRICE_*` env id. If an env price id is the $20 legacy price, it is ignored.

## Free vs Premium (current features)

### Free

- Account, onboarding, dashboard & scores  
- Bible reader  
- **Limited Salvazion AI** (requires sign-in):  
  - Coach: **5 messages / day**  
  - Coach voice / TTS: **3 / day**  
  - AI devotionals: **1 / day** (then rules-based fallback)  
  - Cineanthropometry: **2 / week**  
  - Meal photo AI: **3 / day**  
- Holding **$SALVAZION** does not change those Free limits (DEC-20261014-01). A verified wallet can still qualify for the included first month of Premium, below.  
- Manual health logging  
- Freedom browse (base)  
- Solana wallet connect + $SALVAZION swap (Jupiter)  
- Basic Community invites  
- Profile / theme / language  

### Premium

- **Unlimited** Salvazion AI (coach, TTS, devotionals, cineanthropometry, meal vision)  
- **Cloud wearables** OAuth (Fitbit, Oura, WHOOP, Garmin)  
- Advanced health tools (biomarkers, clinical, women’s health modules)  
- Full calendar & advanced prayer tools  
- Full Freedom library + swap terminal convenience  
- Unlimited Community invites & tracking  

## Env vars (Vercel + local)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...   # for webhook → subscriptions table
# Display/KPI only. Checkout ignores these if they are the legacy $20 price
# and always resolves lookup_keys salvazion_premium_monthly_49 / salvazion_premium_annual_39.
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_1U0WEWHOw5ZkjRlZHXRW0gAX
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_1U0WEXHOw5ZkjRlZOwkxysed
```

## $SALVAZION holder access: first month included (DEC-20261011-27)

Signed-in hub checkout only (`/api/billing/checkout`, monthly and annual). The guest `/premium/checkout` never gets a trial.

At Checkout Session creation the server (`lib/billing/holder-trial-server.ts`, rules in `lib/billing/holder-trial.ts`) checks, failing closed on any doubt:
1. Verified wallet in `wallet_holder_links` (signature flow verify-holdings v1).
2. Fresh on-chain $SALVAZION balance (Token-2022, RPC `getTokenAccountsByOwner`).
3. USD price from Jupiter Price API v3 (`usdPrice`), quote no older than `HOLDER_TRIAL_MAX_PRICE_AGE_SLOTS` (≈24 h) vs current slot; optional `HOLDER_TRIAL_MIN_LIQUIDITY_USD`. Unavailable/stale → no trial.
4. `balance × price ≥ HOLDER_TRIAL_MIN_USD` (default 20).
5. Never used: no prior subscription for the Stripe customer, and no subscription found by Stripe Search with `metadata['holder_trial_wallet']` = wallet hash or `metadata['supabase_user_id']` = user. Stripe error → no trial. No DB migration.

If eligible: `subscription_data.trial_period_days = 30`, `payment_method_collection = 'always'`, metadata `holder_trial=true` + `holder_trial_wallet=<sha256 hash>`, earlier open holder-trial sessions of the customer are expired, and `product_events` gets `holder_trial_checkout`. After 30 days Stripe charges the normal price (US$49/mo or US$468/yr). No coupons, promotion codes or `discounts` (DEC-20261011-26). Not eligible → normal full-price checkout.

`/hub/profile` (holder card) shows one informational line from `GET /api/billing/holder-trial` (no wallet, balance or USD value returned). Kill switch: `HOLDER_TRIAL_ENABLED=0`.

## Webhook

1. Stripe Dashboard → Developers → Webhooks  
2. Endpoint: `https://app.salvazion.org/api/billing/webhook`  
3. Events: `checkout.session.completed`, `checkout.session.expired` (optional, log only), `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`  
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`  
   Unsigned payloads are rejected. There is no unsigned fallback.

## Checkout consent + abandoned-cart recovery

Both Premium Checkout flows (guest `/premium/checkout` and signed-in `/api/billing/checkout`) build their params in `lib/billing/checkout-params.ts` and always send:

- **`consent_collection` is not sent** (SLV-CHECKOUT-TOS-20261013-1, 13-oct-2026). With `consent_collection.promotions = 'auto'` Stripe rejected every Checkout Session (*"To set `consent_collection.promotions`, please visit https://dashboard.stripe.com/settings/checkout to agree to the Terms of Service."*) because the Checkout ToS were never accepted in the Dashboard. Stripe consent was never used to contact anyone (DEC-20261011-14), so it was removed. Re-adding it needs a zone-A decision by Cristian **and** accepting the Checkout ToS first.
- Privacy 7.1 (EN/ES/PT) updated in the same PR: checkout does not collect promotional consent, nothing is sent based on checkout, any future opt-in will be our own unchecked box (Cristian, 13-oct).
- `after_expiration.recovery.enabled = true` — an expired session (24 h default) carries a recovery URL valid 30 days. `recovery.allow_promotion_codes` is `false`.
- **No promotion codes or discounts** (DEC-20261011-26, DEC-20261021-01 (2)): `allow_promotion_codes` is `false` on the Checkout Session and on recovery, and no `discounts`, coupons, or promotion codes are passed. Premium has no promo-code field of its own. Re-enabling needs a new zone-A decision by Cristian. The included first month (DEC-20261011-27) stays a server-side trial, not a coupon.

**Stripe-collected promotions consent is NOT used to contact anyone** (MTP: the API cannot tell a Stripe pre-checked box from one the customer ticked; `consent.promotions` is only the final `opt_in`/`opt_out`). Abandoned checkouts are only logged (`promotions_consent` in the log is now always null). Contacting anyone would need our own unchecked checkbox before redirecting to Checkout (future change, not built).

`checkout.session.expired` is handled by the webhook with a PII-free log line only (consent state, whether a recovery URL exists). **No recovery or promotional email is sent by the app.** Any such email needs explicit approval, must go only to `consent.promotions = 'opt_in'`, and must carry sender info + unsubscribe. Stripe requires the privacy policy to disclose promotional-email use before sending any.

To receive `checkout.session.expired`, the webhook endpoint must subscribe to that event (Dashboard → Webhooks). Not changed while salvazion.org is on the registrar hold.

## Supabase

Run `supabase/subscriptions.sql` in the SQL editor so entitlements persist.

Run `supabase/ai-usage.sql` so Free AI quotas persist (`ai_usage` table).

Run `supabase/holder-verify.sql` for verify-holdings v1: `wallet_holder_links` (signature-verified wallet, one wallet per account), `holder_verify_nonces` (replay protection) and `product_events` (`bono_activado`, `upgrade_click`). DEC-20261014-01: a verified balance does not change Free AI limits. The included first month is DEC-20261011-27, above. The old unverified `profiles.solana_wallet` is not used for that check.

## Customer Portal

Enable Customer Portal in Stripe Billing settings (cancel / update payment method).

## Customer emails (From / support)

- **Support email** (Dashboard → Public business information): **`info@salvazion.org`**
- Optional: custom email domain `salvazion.org` so receipts/invoices leave Stripe’s default `stripe.com` domain  
  (Stripe uses fixed local-parts like `receipts@`, `invoice@` on your domain; replies go to support email)

Full steps: [`docs/email.md`](./email.md)

## App routes

- `/hub/premium` — plans & checkout (`?checkout=month|year` resumes Stripe Checkout after login/signup; `?billing=cancel` after cancel)  
- `/hub/premium/success` — thank-you after Stripe Checkout (`success_url`)  
- `/hub/profile` — `BillingCard` (current plan, renewal, Upgrade / manage)  
- Landing `#pricing` and dashboard show current plan + a single **Upgrade to Premium — $49/mo** CTA → Stripe Checkout  
- Logged-out users: Checkout API returns `auth_required` → `/auth/signup?next=/hub/premium?checkout=month` then auto-starts Checkout (onboarding is not required to pay)  
- APIs: `/api/billing/checkout` (CSRF origin + rate limit), `/portal`, `/status` (no Stripe customer ids), `/webhook` (signature required)

## Security

- Entitlements are written only after a verified Stripe webhook (`STRIPE_WEBHOOK_SECRET` + `stripe-signature`). Unsigned payloads are rejected.  
- Client `/api/billing/status` returns a public slice (plan, renewal, `canManage`) — never `customerId` / `subscriptionId` / `priceId`.  
- Checkout price IDs live in `lib/billing/price-ids.ts` (server). Client copy uses lookup keys and `$49` labels only.

## Post-deploy checkout smoke test

`npm run smoke:checkout -- <deployment-url> [month|year]` (a GitHub Action template is in `docs/ci/smoke-checkout.yml`; copy it to `.github/workflows/` with a token that has `workflow` scope, on `deployment_status: success`) calls `GET /premium/checkout?plan=month&e2e=1`. The app runs the real guest code path, creates a Checkout Session with `metadata.e2e='true'`, no customer and no email, then **expires it immediately** (`checkout.sessions.expire`) and returns `{ok, session_id_prefix, url_host, status, e2e}`. Pass = 200, `url_host=checkout.stripe.com`, `status=expired`, `e2e=true`. Nothing is payable; Pulso/KPI/collect_logs exclude sessions with `metadata.e2e`.

Allowed on Vercel preview deployments; in production only with header `x-salvazion-smoke` equal to env `SMOKE_CHECKOUT_TOKEN` (unset = smoke disabled in prod). Optional `VERCEL_AUTOMATION_BYPASS_SECRET` for protected previews.
