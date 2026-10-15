/** Ask the public resend route for another signup confirmation. */
export async function requestConfirmationResend(
  email: string,
  next?: string
): Promise<'sent' | 'limited' | 'invalid'> {
  const res = await fetch('/api/auth/resend-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), next }),
  });
  if (res.status === 429) return 'limited';
  if (res.status === 400) return 'invalid';
  return 'sent';
}
