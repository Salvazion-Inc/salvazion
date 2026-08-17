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
- Monthly price: `price_1U0WEWHOw5ZkjRlZHXRW0gAX` (`salvazion_premium_monthly_49`)
- Annual price: `price_1U0WEXHOw5ZkjRlZOwkxysed` (`salvazion_premium_annual_39`)

## Free vs Premium (current features)

### Free

- Account, onboarding, dashboard & scores  
- Bible reader  
- **Limited Grok AI** (requires sign-in):  
  - Coach: **5 messages / day**  
  - Coach voice / TTS: **3 / day**  
  - AI devotionals: **1 / day** (then rules-based fallback)  
  - Cineanthropometry: **2 / week**  
  - Meal photo AI: **3 / day**  
- Hold **$SALVAZION on-chain** (linked wallet) → **2× those Free limits**  
- Manual health logging  
- Freedom browse (base)  
- Solana wallet connect + $SALVAZION swap (Jupiter)  
- Basic Phalanx invites  
- Profile / theme / language  

### Premium

- **Unlimited** Grok AI (coach, TTS, devotionals, cineanthropometry, meal vision)  
- **Cloud wearables** OAuth (Fitbit, Oura, WHOOP, Garmin)  
- Advanced health tools (biomarkers, clinical, women’s health modules)  
- Full calendar & advanced prayer tools  
- Full Freedom library + swap terminal convenience  
- Unlimited Phalanx invites & tracking  

## Env vars (Vercel + local)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...   # for webhook → subscriptions table
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_1U0WEWHOw5ZkjRlZHXRW0gAX
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_1U0WEXHOw5ZkjRlZOwkxysed
```

## Webhook

1. Stripe Dashboard → Developers → Webhooks  
2. Endpoint: `https://app.salvazion.org/api/billing/webhook`  
3. Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`  
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## Supabase

Run `supabase/subscriptions.sql` in the SQL editor so entitlements persist.

Run `supabase/ai-usage.sql` so Free AI quotas persist (`ai_usage` table + `profiles.solana_wallet` for the $SALVAZION holder bonus).

## Customer Portal

Enable Customer Portal in Stripe Billing settings (cancel / update payment method).

## Customer emails (From / support)

- **Support email** (Dashboard → Public business information): **`info@salvazion.org`**
- Optional: custom email domain `salvazion.org` so receipts/invoices leave Stripe’s default `stripe.com` domain  
  (Stripe uses fixed local-parts like `receipts@`, `invoice@` on your domain; replies go to support email)

Full steps: [`docs/email.md`](./email.md)

## App routes

- `/hub/premium` — plans & checkout  
- `/hub/profile` — `BillingCard` (subscribe / manage)  
- APIs: `/api/billing/checkout`, `/portal`, `/status`, `/webhook`
