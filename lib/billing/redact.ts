/** Redact Stripe ids and emails before logging. Never log PAN / CVC. */
export function redactBilling(value: string): string {
  return value
    .replace(/\b(cus|sub|in|cs|pi|price|prod|si|ch|pm|seti)_[A-Za-z0-9]+/g, '$1_…')
    .replace(/\b[\w.+-]+@[\w.-]+\.\w+\b/g, '[redacted-email]');
}

export function billingLog(scope: string, err: unknown): void {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'unknown';
  console.error(`[${scope}]`, redactBilling(raw));
}
