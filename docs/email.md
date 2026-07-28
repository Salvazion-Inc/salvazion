# Emails Salvazion — remitente `info@salvazion.org`

**Política:** todos los emails del producto (login, registro, recuperación, pagos, facturas, logros, información, etc.) deben salir de **`info@salvazion.org`** (o, en Stripe, del dominio `salvazion.org` con reply/support a esa dirección).

La app **no** envía Auth ni facturas por sí sola: hoy los mandan **Supabase** y **Stripe**. Cualquier email futuro de la app (logros, avisos) usa `lib/email/mailer.ts` con el mismo From.

| Tipo | Quién envía | Cómo fijar el From / contacto |
|------|-------------|-------------------------------|
| Confirmación de registro, magic link, reset password | **Supabase Auth** | Custom SMTP → From = `info@salvazion.org` |
| Recibos, facturas, fallos de pago, renovaciones | **Stripe** | Support email + dominio de email personalizado |
| Logros / info / transaccionales de la app | **App** (`sendAppEmail`) | `EMAIL_FROM` + Resend API |
| Contacto legal / footer | UI (`mailto:`) | `SUPPORT_EMAIL` en `lib/config/site.ts` |

Constantes en código:

- `lib/config/site.ts` → `SUPPORT_EMAIL = 'info@salvazion.org'`
- `lib/email/config.ts` → From / Reply-To
- `lib/email/mailer.ts` → envío vía Resend

---

## 1) Supabase Auth (login, registro, magic link, recuperación)

Sin custom SMTP, Supabase usa su servidor de prueba (límites bajos y From de Supabase). En producción **hay que** configurar SMTP propio.

### 1.1 Verificar dominio en un proveedor SMTP

Proveedores recomendados (cualquiera con SMTP sirve):

- [Resend](https://resend.com/docs/send-with-supabase-smtp) (recomendado si también usas el mailer de la app)
- AWS SES, Postmark, SendGrid, Brevo, ZeptoMail

1. Añade el dominio **`salvazion.org`**
2. Publica registros DNS (SPF, DKIM, y preferible DMARC)
3. Espera verificación
4. Crea/autoriza el remitente **`info@salvazion.org`**

### 1.2 Configurar en Supabase Dashboard

Proyecto: `kppylfrsclkdmtpobpxd` (o el actual)

1. Abre [Authentication → Emails → SMTP Settings](https://supabase.com/dashboard/project/kppylfrsclkdmtpobpxd/auth/smtp)
2. **Enable Custom SMTP**
3. Rellena (ejemplo Resend):

| Campo | Valor |
|-------|--------|
| Sender email | `info@salvazion.org` |
| Sender name | `Salvazion` |
| Host | `smtp.resend.com` |
| Port | `465` o `587` |
| Username | `resend` |
| Password | API key de Resend |

4. Guarda y prueba: **Authentication → Users → Invite** o un signup de prueba.

### 1.3 Plantillas (opcional)

**Authentication → Email Templates**: confirma que el copy diga Salvazion y no un nombre genérico. El From lo define el SMTP, no la plantilla.

### 1.4 Management API (alternativa)

```bash
export SUPABASE_ACCESS_TOKEN="…"   # https://supabase.com/dashboard/account/tokens
export PROJECT_REF="kppylfrsclkdmtpobpxd"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "smtp_admin_email": "info@salvazion.org",
    "smtp_host": "smtp.resend.com",
    "smtp_port": "587",
    "smtp_user": "resend",
    "smtp_pass": "re_xxxxxxxx",
    "smtp_sender_name": "Salvazion"
  }'
```

Docs: https://supabase.com/docs/guides/auth/auth-smtp

---

## 2) Stripe (pagos, facturas, recibos, fallos de cobro)

### 2.1 Email de soporte (reply / contacto)

Dashboard → **Settings → Public business information** (o Business details):

- **Support email:** `info@salvazion.org`
- **Support phone / URL** (opcional): `https://app.salvazion.org` o `https://www.salvazion.org`

Las respuestas de clientes a emails de Stripe van a este soporte.

### 2.2 Dominio personalizado (From en dominio propio)

Por defecto Stripe envía desde `stripe.com`. Para enviar desde **tu dominio**:

1. [Customer emails](https://dashboard.stripe.com/settings/emails) → **Add domain** → `salvazion.org`
2. Añade los DNS que indique Stripe (TXT ownership, CNAMEs DKIM / Mail From)
3. Publica DMARC (`_dmarc`) si aún no existe, p. ej.  
   `v=DMARC1; p=none; rua=mailto:info@salvazion.org`
4. Cuando esté **Verified**, actívalo como sending domain

**Importante:** Stripe no permite un único From arbitrario para todo. Tras el dominio custom usa direcciones fijas del estilo:

- `receipts@salvazion.org`
- `invoice@salvazion.org`
- `billing@salvazion.org`
- `failed-payments@salvazion.org`
- `support@salvazion.org`
- …

No puede forzar *todo* a `info@…`, pero sí **dominio Salvazion** + **reply/support = info@salvazion.org**. Eso es lo correcto para facturas y cobros.

### 2.3 Notificaciones automáticas

Activa las que necesites en:

- https://dashboard.stripe.com/settings/billing/automatic  
- https://dashboard.stripe.com/settings/emails  

(recibos de pago, fallos de tarjeta, renovaciones, etc.)

### 2.4 Checkout de la app

El checkout ya asocia `customer.email` del usuario Supabase. No define el From de Stripe (eso es solo Dashboard / dominio).

---

## 3) Emails de la app (logros, información, futuros)

```env
# Vercel + .env.local
EMAIL_FROM=info@salvazion.org
EMAIL_FROM_NAME=Salvazion
EMAIL_REPLY_TO=info@salvazion.org
RESEND_API_KEY=re_xxxxxxxx
```

En Resend: dominio `salvazion.org` verificado y `info@salvazion.org` permitido como From.

Uso en servidor:

```ts
import { sendAppEmail } from '@/lib/email/mailer';

await sendAppEmail({
  to: user.email,
  subject: 'Nuevo logro en Salvazion',
  text: 'Has desbloqueado…',
});
```

Sin `RESEND_API_KEY` el mailer no envía (log + `skipped: true`).

---

## 4) DNS checklist (dominio `salvazion.org`)

| Uso | Qué configurar |
|-----|----------------|
| Entrega general | SPF + DKIM del proveedor SMTP (Resend/SES/…) |
| Anti-spoofing | DMARC en `_dmarc.salvazion.org` |
| Stripe | Registros extra que muestre Stripe en Customer emails |
| Buzón real | MX para que `info@` reciba respuestas (Google Workspace, Microsoft 365, etc.) |

No mezcles Auth con marketing: usa el mismo From de producto (`info@`) o un subdominio de envío si el proveedor lo recomienda, pero el buzón de contacto sigue siendo `info@salvazion.org`.

---

## 5) Cómo verificar que quedó bien

1. **Auth:** regístrate con un email real → el mensaje debe mostrar From **Salvazion \<info@salvazion.org\>** (no `@supabase` / `@mail.app.supabase.io`).
2. **Stripe:** cobro de prueba o envío de recibo de prueba → dominio `salvazion.org` (o al menos support/reply `info@`).
3. **App:** con `RESEND_API_KEY`, llama a `sendAppEmail` desde un script/ruta de prueba.

---

## 6) Resumen de acciones manuales (una sola vez)

- [ ] Verificar `salvazion.org` en Resend (u otro SMTP)
- [ ] Supabase custom SMTP con **Sender = info@salvazion.org**
- [ ] Stripe **Support email = info@salvazion.org**
- [ ] (Recomendado) Stripe **custom email domain = salvazion.org**
- [ ] Vercel: `EMAIL_FROM`, `EMAIL_FROM_NAME`, `RESEND_API_KEY`
- [ ] Probar signup + un recibo Stripe
