# Login con X (OAuth 2.0)

La app usa el provider Supabase **`x`** (X / Twitter OAuth 2.0).  
El provider legacy **`twitter`** (OAuth 1.0a) está **deprecado** y no se usa por defecto.

## Vercel (opcional)

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_X_AUTH_PROVIDER` | `x` (recomendado; el código ya usa `x` por defecto) |

**No pongas** Client ID/Secret de X en Vercel. Van en Supabase.

Solo si necesitas el fallback deprecado (no recomendado):

```env
NEXT_PUBLIC_X_AUTH_ALLOW_LEGACY=true
```

## Supabase — activar X OAuth 2.0

Proyecto: `kppylfrsclkdmtpobpxd`

1. **Authentication → Providers → X / Twitter (OAuth 2.0)**
2. **Enable = ON**
3. **Client ID** + **Client Secret** (OAuth 2.0 de X, no API Key de V1)
4. **Save**

Puedes **desactivar** el provider **Twitter** (OAuth 1.0a) si ya no lo quieres.

## Portal de X — [developer.x.com](https://developer.x.com)

1. App → **User authentication settings**
2. Permissions: **Read**
3. **Request email from users: ON** (importante para el perfil)
4. Type: **Web App**
5. Callback:
   ```
   https://kppylfrsclkdmtpobpxd.supabase.co/auth/v1/callback
   ```
6. Website: `https://salvazion.org`
7. **Terms of service URL:** `https://salvazion.org/terms`
8. **Privacy policy URL:** `https://salvazion.org/privacy`
9. **Save**
10. **Keys and tokens** → sección **OAuth 2.0 Client ID and Client Secret**  
   - Copia Client ID  
   - Regenera/copia Client Secret si hace falta  
11. Pégalos en Supabase (paso de Providers)

## Redirect URLs de la app (Supabase URL Configuration)

- Site URL: `https://app.salvazion.org`
- Redirects:
  ```
  https://app.salvazion.org/auth/callback
  https://app.salvazion.org/auth/confirm
  http://localhost:3000/auth/callback
  ```

## Probar

Incógnito → `https://app.salvazion.org/auth/login` → **Continuar con X**

## Errores

| Mensaje | Qué hacer |
|---------|-----------|
| `provider is not enabled` | Activa **X / Twitter (OAuth 2.0)** en el proyecto correcto |
| `Error getting user profile from external provider` | Request email ON; Client ID/Secret OAuth 2.0 correctos; Web App + callback de Supabase |

## Código

- `lib/auth/x-oauth.ts` → `provider: 'x'`
- Perfil sigue mostrando `@usuario` desde la identity de X
