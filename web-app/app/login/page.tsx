'use client';

import { FormEvent, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { authErrorMessage, isEmailNotConfirmed } from '@/lib/authErrors';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isSupabaseConfigured()) {
      setError(
        'Configuration Supabase manquante. Créez web-app/.env.local avec NEXT_PUBLIC_SUPABASE_*.',
      );
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError(authErrorMessage(signInError));
      if (isEmailNotConfirmed(signInError)) {
        setInfo(
          'Renvoyez l’e-mail de confirmation depuis Supabase (Authentication → Users).',
        );
      }
      return;
    }

    window.location.href = '/';
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="badge">PWA · Next.js · Phase 0</span>
        <h1>Pema Class</h1>
        <p className="subtitle">Connexion à votre établissement</p>

        {error && <div className="alert alert-error">{error}</div>}
        {info && <div className="alert alert-info">{info}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
