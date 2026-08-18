# Tres Welcome (EN · ES · PT)

Cada idioma es un sitio GitBook completo, con su dominio y sus links internos.

| Idioma | Dominio | Carpeta en el repo |
|--------|---------|--------------------|
| English | **https://welcome.salvazion.org** | `Salvazion/` |
| Español | **https://bienvenida.salvazion.org** | `Salvazion-es/` |
| Português | **https://bem-vindo.salvazion.org** | `Salvazion-pt/` |

El CNAME de `welcome` ya apunta a `206369cabd-hosting.gitbook.io`.

## 1) DNS (Canva → Web Domains → Manage DNS)

El dominio usa `ns1/2/3.systemdns.com`. Crea **dos CNAME** (igual que `welcome`):

| Tipo | Host | Valor |
|------|------|--------|
| CNAME | `bienvenida` | `206369cabd-hosting.gitbook.io` |
| CNAME | `bem-vindo` | `206369cabd-hosting.gitbook.io` |

Si GitBook te da otro Target al añadir el dominio, usa **ese** Target, no el de la tabla.

Si usas Cloudflare delante: el registro debe estar en **DNS only** (nube gris), no proxied.

## 2) GitBook (dos sitios nuevos)

Hoy solo hay un espacio publicado en `welcome.salvazion.org` (carpeta `Salvazion/`).

Para ES y PT:

1. En [app.gitbook.com](https://app.gitbook.com) → **New site** (o **Add variant** si tu plan lo permite).
2. **GitHub sync** al mismo repo `SalvazionApp/salvazion-app`:
   - Sitio ES → root path `Salvazion-es`
   - Sitio PT → root path `Salvazion-pt`
3. **Settings → Custom domain**:
   - ES → `bienvenida.salvazion.org`
   - PT → `bem-vindo.salvazion.org`
4. Espera a que GitBook verifique el CNAME y emita SSL (a menudo 1 hora).

El Welcome en inglés ya no mezcla páginas ES/PT: cada libro vive solo en su idioma.

## 3) App

El botón Welcome de [salvazion.org](https://salvazion.org) abre el dominio del idioma activo:

- EN → welcome.salvazion.org
- ES → bienvenida.salvazion.org
- PT → bem-vindo.salvazion.org
