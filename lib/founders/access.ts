/**
 * Founder gate for salvazion.org/dashboard.
 * The company operator is a founder. Extra founders can be listed in
 * FOUNDER_EMAILS or BUSINESS_ADMIN_EMAILS (comma-separated).
 */

import { isBusinessAdminEmail } from '@/lib/business/access';

function listedFounders(): string[] {
  return (process.env.FOUNDER_EMAILS || '')
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isFounderEmail(email?: string | null): boolean {
  if (isBusinessAdminEmail(email)) return true;
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return listedFounders().includes(normalized);
}
