import type { AuthError } from '@supabase/supabase-js';

export function authErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const auth = error as AuthError;
    const code = (auth.code ?? '').toLowerCase();
    const msg = (auth.message ?? '').toLowerCase();

    if (
      code === 'email_not_confirmed' ||
      msg.includes('email not confirmed') ||
      msg.includes('email_not_confirmed')
    ) {
      return (
        'Compte non confirmé. Ouvrez le lien dans l’e-mail Supabase (spams inclus), ' +
        'puis reconnectez-vous.'
      );
    }

    if (
      code === 'invalid_credentials' ||
      msg.includes('invalid login credentials')
    ) {
      return 'E-mail ou mot de passe incorrect.';
    }

    if (msg.includes('rate limit') || code === 'over_request_rate_limit') {
      return 'Trop de tentatives. Patientez une minute.';
    }

    if (auth.message) return auth.message;
  }

  const text = String(error);
  if (text.includes('Failed to fetch') || text.includes('NetworkError')) {
    return 'Pas de connexion au serveur. Vérifiez votre réseau.';
  }

  return `Erreur : ${text}`;
}

export function isEmailNotConfirmed(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('message' in error)) return false;
  const auth = error as AuthError;
  const code = (auth.code ?? '').toLowerCase();
  const msg = (auth.message ?? '').toLowerCase();
  return (
    code === 'email_not_confirmed' ||
    msg.includes('email not confirmed') ||
    msg.includes('email_not_confirmed')
  );
}
