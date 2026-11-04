# Google sign-in with GIS + signInWithIdToken (flag)

Goal: Google's screen no longer says "continue to kppylfrsclkdmtpobpxd.supabase.co".

## Flag (default off = current Supabase OAuth redirect, unchanged)

| Vercel env var (Production + Preview) | Value |
|---|---|
| `NEXT_PUBLIC_GOOGLE_GIS` | `1` to turn it on |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Web OAuth Client ID (`…apps.googleusercontent.com`). Public, not a secret. |

Both are `NEXT_PUBLIC_*`, so they take effect on the next build/redeploy.
If either is missing or the GIS script fails to load, the button falls back to the current OAuth flow.

## Pending external steps (not done in this PR)

1. Google Cloud Console → APIs & Services → Credentials → the Web client already used by Supabase (or a new one):
   - Authorized JavaScript origins: `https://salvazion.org`, `https://www.salvazion.org` (and `http://localhost:3000` for dev).
   - OAuth consent screen: app name "Salvazion", home page and privacy (`/privacy`) URLs, authorized domain `salvazion.org`.
2. Supabase → Authentication → Providers → Google: the Client ID above must be in "Client IDs" (authorized client IDs for ID tokens). Keep "Skip nonce check" OFF (the app sends a nonce).
3. Vercel → salvazion-app → set the two env vars above and redeploy.

## Rollback

Set `NEXT_PUBLIC_GOOGLE_GIS=0` (or delete it) and redeploy, or promote the previous deployment.

---

# Email confirmation link (prefetch / "link_expired")

Mail scanners open the link first; Supabase confirms the account on that GET, so the user's click comes back as expired or used.

What this PR does without any external change:
- Signup / resend links carry `flow=signup` in `redirect_to`. When such a link comes back expired or used, login shows: "Your account is already confirmed … sign in" (ES/EN/PT) instead of the generic expired message.
- `/auth/confirm` (token_hash flow) is prefetch-safe: GET returns a page that auto-submits a POST; `verifyOtp` only runs on POST.

Optional (recommended), not applied: switch the Supabase "Confirm signup" email template to the token_hash flow so scanners cannot consume the token:

```
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/hub/onboarding">Confirm</a>
```

Supabase → Authentication → Emails → Confirm signup. Rollback: restore `{{ .ConfirmationURL }}`.
