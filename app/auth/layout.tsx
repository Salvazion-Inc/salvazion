/**
 * Shared auth shell — no robots here.
 * Public entry (login/signup) opts into indexing; recovery routes noindex.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
