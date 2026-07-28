# Salvazion Premium (Stripe)

Freemium app with **Premium** subscription on the **Salvazion, Inc.** Stripe account (`acct_1T3hCIHOw5ZkjRlZ`).

## Pricing

| Plan | Price |
|------|--------|
| Free | $0 |
| Premium Monthly | **$20 / month** |
| Premium Annual | **$15 / month** equivalent (**$180 / year**) |

### Stripe objects (live)

- Product: `prod_UxwcMVMNlKeczI` — *Salvazion Premium*
- Monthly price: `price_1Ty0iyHOw5ZkjRlZMsCZPQWY` (`salvazion_premium_monthly`)
- Annual price: `price_1Ty0iyHOw5ZkjRlZQBQYbfQ7` (`salvazion_premium_annual`)

## Free vs Premium (current features)

### Free

- Account, onboarding, dashboard & scores  
- Bible reader  
- Daily devotional (**rules engine**, not Grok AI)  
- Manual health logging  
- Freedom browse (base)  
- Solana wallet connect + $SALVAZION amount on profile  
- Basic Phalanx invites  
- Profile / theme / language  

### Premium

- Green Lion **AI coach** (Grok chat) + **TTS voice**  
- **AI devotionals** (Grok)  
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
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_1Ty0iyHOw5ZkjRlZMsCZPQWY
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_1Ty0iyHOw5ZkjRlZQBQYbfQ7
```

## Webhook

1. Stripe Dashboard → Developers → Webhooks  
2. Endpoint: `https://app.salvazion.org/api/billing/webhook`  
3. Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`  
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## Supabase

Run `supabase/subscriptions.sql` in the SQL editor so entitlements persist.

## Customer Portal

Enable Customer Portal in Stripe Billing settings (cancel / update payment method).

## App routes

- `/hub/premium` — plans & checkout  
- `/hub/profile` — `BillingCard` (subscribe / manage)  
- APIs: `/api/billing/checkout`, `/portal`, `/status`, `/webhook`
