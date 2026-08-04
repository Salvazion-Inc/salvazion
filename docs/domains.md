# Dominios Salvazion

| URL | Qué es |
|-----|--------|
| **https://salvazion.org** | **App principal** (Next.js en Vercel). Reemplaza el sitio Canva. |
| **https://www.salvazion.org** | Redirect 308 → `salvazion.org` |
| **https://app.salvazion.org** | Alias legacy · redirect 308 → `salvazion.org` |
| **https://www.app.salvazion.org** | Alias legacy · redirect 308 → `salvazion.org` |

> Antes: `www.salvazion.org` / apex servían el marketing Canva.  
> Ahora: el producto vive en el apex; Canva debe desconectarse del DNS.

## 1) Quitar Canva y apuntar a Vercel (obligatorio)

**Hoy (hasta que cambies DNS):**

| Host | Quién responde |
|------|----------------|
| `salvazion.org` / `www` | **Canva** (`A 103.169.142.0`, Cloudflare de Canva) |
| `app.salvazion.org` | **Nuestra app** (Vercel) |

Nameservers del dominio: `ns1/2/3.systemdns.com` (típico si el dominio se compró o se conectó vía **Canva**).

### A) En Canva — desconectar el sitio del dominio

1. Entra a [canva.com](https://www.canva.com) con la cuenta del dominio.  
2. **Settings → Web Domains** (o **Configuración → Dominios web**).  
3. Localiza `salvazion.org`.  
4. **Remove / Disconnect / Desconectar** el dominio del website Canva.  
   - Si el dominio lo gestiona Canva y hay “Connected to Canva”, desconéctalo para poder editar los registros A del apex.  
5. Opcional: deja de publicar el website Canva en ese dominio (unpublish).

Documentación Canva: [Manage and disconnect domains](https://www.canva.com/help/managing-domains/).

### B) DNS — apuntar solo a Vercel (sin Canva)

En el panel DNS (Canva **Web Domains → Manage DNS**, o el registrador):

| Acción | Tipo | Host | Valor |
|--------|------|------|--------|
| **Borrar** | A | `@` / apex | `103.169.142.0` (Canva) |
| **Borrar** | A | `www` | `103.169.142.0` (Canva) si existe |
| **Crear/editar** | **A** | `@` | **`76.76.21.21`** (Vercel) |
| **Crear/editar** | **CNAME** | `www` | **`cname.vercel-dns.com`** |
| **Mantener** | **CNAME** | `app` | `cname.vercel-dns.com` (o el de Vercel que ya uses) |

**No dejes** el A de Canva (`103.169.142.0`) en apex ni en `www`.  
**No uses** Canva como hosting del sitio principal.

Si Canva no te deja editar el A del apex, usa en Canva **Change nameservers** y apunta a los nameservers de tu registrador o a los de Vercel (solo si mueves el dominio a Vercel como registrar).

Propagación: minutos a 48 h. Comprueba:

```bash
nslookup salvazion.org
# DEBE ser 76.76.21.21 (Vercel), NUNCA 103.169.142.0 (Canva)
```

Cuando el apex ya sea Vercel, en el proyecto Vercel puedes reactivar redirect  
`app.salvazion.org` → `salvazion.org` (308).

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
