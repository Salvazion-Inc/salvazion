/**
 * Auth redirect helpers — prevent open redirects and normalize destinations.
 */

const FALLBACK = '/hub/dashboard';

/** Only allow relative in-app paths under /hub or /auth. */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string = FALLBACK
): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('://') || trimmed.includes('\\')) return fallback;
  if (!(trimmed.startsWith('/hub') || trimmed.startsWith('/auth'))) return fallback;
  // Block nested protocol tricks like /hub/dashboard@evil.com
  if (/[\s@]/.test(trimmed)) return fallback;
  return trimmed;
}

/** Human-readable Spanish messages for common Supabase auth errors. */
export function mapAuthError(message: string | null | undefined): string {
  if (!message) return 'Ocurrió un error. Intenta de nuevo.';
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirma tu email antes de entrar. Revisa tu bandeja de entrada.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'Ese email ya tiene una cuenta. Inicia sesión o recupera la contraseña.';
  }
  if (m.includes('password should be at least') || m.includes('password is known')) {
    return 'La contraseña no cumple los requisitos de seguridad (mín. 8 caracteres).';
  }
  if (m.includes('signup is disabled')) {
    return 'El registro está temporalmente deshabilitado.';
  }
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('security purposes')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
  }
  if (m.includes('missing next_public_supabase') || m.includes('supabase no está')) {
    return message;
  }

  return message;
}

/** Query-param error codes from our own redirects. */
export function mapQueryAuthError(code: string | null | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case 'auth_callback_failed':
      return 'No pudimos completar el acceso. El enlace puede haber expirado. Intenta de nuevo.';
    case 'confirm_failed':
      return 'No pudimos confirmar el email. Solicita un nuevo enlace.';
    case 'session_missing':
      return 'Tu sesión no está activa. Inicia sesión de nuevo.';
    case 'password_updated':
      return null; // success handled separately
    default:
      return null;
  }
}
