# Salvazion App

Phalanx digital: **Salvation · Health · Freedom**.

## Dominios

| URL | Uso |
|-----|-----|
| [www.salvazion.org](https://www.salvazion.org) | Sitio marketing antiguo (Canva) — **no** este repo |
| [app.salvazion.org](https://app.salvazion.org) | **Esta app** (Vercel + Supabase) |

Guía DNS / Vercel / Supabase: [`docs/domains.md`](docs/domains.md).  
Emails del producto (From **`info@salvazion.org`**): [`docs/email.md`](docs/email.md).

## Desarrollo

```bash
cp .env.example .env.local
# Rellena en .env.local (única plantilla: .env.example):
#   NEXT_PUBLIC_SUPABASE_* , SUPABASE_SERVICE_ROLE_KEY,
#   STRIPE_* , XAI_* , NEXT_PUBLIC_REOWN_PROJECT_ID, wearables opcionales

npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Next.js local |
| `npm run build` | Build producción |
| `npm run cap:init` | Shell nativo Capacitor |
| `npm run cap:doctor` | Estado Capacitor |

## Deploy

Vercel conectado a `main`. Dominio de producto: **`app.salvazion.org`**.

Variables en Vercel (ver lista completa en `.env.example`):

```
NEXT_PUBLIC_APP_URL=https://app.salvazion.org
NEXT_PUBLIC_SUPABASE_URL=https://kppylfrsclkdmtpobpxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
STRIPE_SECRET_KEY=…
STRIPE_WEBHOOK_SECRET=…
NEXT_PUBLIC_REOWN_PROJECT_ID=…
```
