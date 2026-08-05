/**
 * Salvazion Inc. business console — access control.
 * Only the company operator email may see revenue / funnel KPIs.
 */

export const BUSINESS_ADMIN_EMAIL = 'info@salvazion.org';

function extraAdminEmails(): string[] {
  const raw = process.env.BUSINESS_ADMIN_EMAILS || '';
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Normalize and test business-admin eligibility (server + client). */
export function isBusinessAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const n = email.trim().toLowerCase();
  if (!n) return false;
  if (n === BUSINESS_ADMIN_EMAIL) return true;
  return extraAdminEmails().includes(n);
}
