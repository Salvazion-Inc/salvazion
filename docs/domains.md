# Dominios Salvazion

| URL | Qué es |
|-----|--------|
| **https://salvazion.org** | **App principal** (Next.js en Vercel). Reemplaza el sitio Canva. |
| **https://www.salvazion.org** | Redirect 308 → `salvazion.org` |
| **https://app.salvazion.org** | Alias legacy · redirect 308 → `salvazion.org` |
| **https://www.app.salvazion.org** | Alias legacy · redirect 308 → `salvazion.org` |

> Antes: `www.salvazion.org` / apex servían el marketing Canva.  
> Ahora: el producto vive en el apex; Canva debe desconectarse del DNS.

## 1) DNS en Vercel

El registro sigue en Canva hasta el 2027-10-08. Los nameservers públicos son:

- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

La zona la sirve Vercel. Con esos nameservers, Canva ya no publica el DNS. No vuelvas a poner el A de Canva `103.169.142.0`.

| Host | Registro |
|------|----------|
| `@` | ALIAS al proyecto `salvazion-app` |
| `www`, `app` | Vercel, redirect 308 al ápice |
| `www.app` | CNAME `cname.vercel-dns-017.com`, redirect 308 al ápice |
| `welcome`, `bienvenida`, `bem-vindo` | CNAME `206369cabd-hosting.gitbook.io` |
| `@` MX | `smtp.google.com` prioridad 1 |
| `@` TXT | verificación de Google y `v=spf1 include:_spf.google.com ~all` |
| `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@salvazion.org` |

`bienvenida.salvazion.org` y `bem-vindo.salvazion.org` resuelven, pero GitBook no tiene esos hostnames y HTTPS falla. Español y portugués están en `https://welcome.salvazion.org/bienvenida` y `https://welcome.salvazion.org/bem-vindo`.

## 2) Vercel (ya configurado en proyecto `salvazion-app`)

Dominios del proyecto:

- `salvazion.org` — producción (sin redirect)
- `www.salvazion.org` → `salvazion.org` (308)
- `app.salvazion.org` → `salvazion.org` (308)
- `www.app.salvazion.org` → `salvazion.org` (308)

Environment variable (Production + Preview + Development):

```env
NEXT_PUBLIC_APP_URL=https://salvazion.org
```

Redeploy después de cambiar DNS o variables.

## 3) Supabase (Authentication → URL Configuration)

**Dashboard (manual):**  
[Auth URL Configuration](https://supabase.com/dashboard/project/kppylfrsclkdmtpobpxd/auth/url-configuration)

- **Site URL:** `https://salvazion.org`
- **Redirect URLs** (añade todas; puedes dejar las de `app.` un tiempo):

```
https://salvazion.org/auth/callback
https://salvazion.org/auth/confirm
https://www.salvazion.org/auth/callback
https://www.salvazion.org/auth/confirm
https://app.salvazion.org/auth/callback
https://app.salvazion.org/auth/confirm
https://www.app.salvazion.org/auth/callback
https://www.app.salvazion.org/auth/confirm
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
```

**CLI (con token de Management API):**  
1. Crea un token en https://supabase.com/dashboard/account/tokens  
2. Ejecuta:

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_..."
node scripts/update-supabase-auth-urls.mjs
```

## 4) X (Twitter) Developer Portal

- **Callback** (sigue siendo Supabase):

```
https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback
```

- **Website URL:** `https://salvazion.org`

## 5) Google OAuth (si aplica)

Authorized origins / redirect URIs deben incluir `https://salvazion.org`  
(y opcionalmente `https://app.salvazion.org` durante la transición).

## 6) Wearables OAuth

```
https://salvazion.org/api/wearables/oauth/{fitbit|oura|whoop|garmin}/callback
```

(Actualiza cada portal de proveedor.)

## 7) Stripe Customer Portal / legal

- Privacy: `https://salvazion.org/privacy`
- Terms: `https://salvazion.org/terms`
- Return URL: `https://salvazion.org/hub/profile`

Script: `node scripts/stripe-set-portal-legal.mjs` (con `STRIPE_SECRET_KEY`).

## 8) Capacitor

```env
CAPACITOR_SERVER_URL=https://salvazion.org
NEXT_PUBLIC_APP_URL=https://salvazion.org
```

Luego: `npm run cap:sync`

## 9) Emails (From: info@salvazion.org)

Sin cambio de política. Guía: [`docs/email.md`](./email.md).

## Comprobar

1. DNS apex → Vercel  
2. `https://salvazion.org` → landing / app  
3. `https://www.salvazion.org` y `https://app.salvazion.org` → redirigen al apex  
4. Login Google / X / email funciona  
5. Checkout Stripe y wearables (si están activos)
