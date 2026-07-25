# Dominios Salvazion

| URL | Qué es |
|-----|--------|
| **https://www.salvazion.org** | Sitio web **antiguo** (Canva). No tocar con este deploy. |
| **https://app.salvazion.org** | **App** (producto actual: Next.js en Vercel). |
| **https://www.app.salvazion.org** | Alias opcional de la app (si lo configuras en DNS). |

## 1) DNS (donde gestionas salvazion.org)

Crea un registro para la app (recomendado):

| Tipo | Nombre | Valor |
|------|--------|--------|
| **CNAME** | `app` | `cname.vercel-dns.com` |

Si quieres también `www.app`:

| Tipo | Nombre | Valor |
|------|--------|--------|
| **CNAME** | `www.app` | `cname.vercel-dns.com` |

**No** apuntes `www` ni `@` (apex) de salvazion.org a Vercel si el sitio Canva debe seguir en `www.salvazion.org`.

## 2) Vercel

1. Proyecto de esta app → **Settings → Domains**
2. Añade:
   - `app.salvazion.org` (principal)
   - opcional: `www.app.salvazion.org` → redirect a `app.salvazion.org`
3. **Settings → Environment Variables** (Production + Preview):

```env
NEXT_PUBLIC_APP_URL=https://app.salvazion.org
NEXT_PUBLIC_SUPABASE_URL=https://kppylfrsclkdmtpobpxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…tu anon key…
```

4. **Redeploy** después de cambiar variables.

## 3) Supabase (mismo proyecto)

**Authentication → URL Configuration**

- **Site URL:** `https://app.salvazion.org`
- **Redirect URLs** (todas):

```
https://app.salvazion.org/auth/callback
https://app.salvazion.org/auth/confirm
https://www.app.salvazion.org/auth/callback
https://www.app.salvazion.org/auth/confirm
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
```

## 4) X (Twitter) Developer Portal

- **Callback** (sigue siendo Supabase, no cambia):

```
https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback
```

- **Website URL:** `https://app.salvazion.org`  
  (o `https://www.salvazion.org` si X exige el dominio raíz verificado)

## 5) Wearables OAuth (si los usas)

Redirect en cada portal:

```
https://app.salvazion.org/api/wearables/oauth/{fitbit|oura|whoop|garmin}/callback
```

## 6) Capacitor (shell nativo)

```env
CAPACITOR_SERVER_URL=https://app.salvazion.org
# o
NEXT_PUBLIC_APP_URL=https://app.salvazion.org
```

Luego: `npm run cap:sync`

## Comprobar

Abre `https://app.salvazion.org` → debe cargar Salvazion Hub / landing de la app.  
`https://www.salvazion.org` → sigue el sitio Canva.
