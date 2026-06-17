'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';

function friendlyError(errorParam: string | null): string | null {
  if (!errorParam) return null;
  if (errorParam === 'auth_callback_missing_code') return 'Lien invalide ou expiré.';
  if (errorParam === 'auth_callback_exchange_failed') return 'Impossible de valider le lien. Réessayez.';
  return 'Une erreur est survenue.';
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setError(friendlyError(searchParams.get('error')));
  }, [searchParams]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError(
        'Configuration Supabase manquante (.env.local : NEXT_PUBLIC_SUPABASE_URL et clé publishable).',
      );
      setReady(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError('Session introuvable. Rouvrez le lien de réinitialisation depuis votre e-mail.');
      }
      setReady(true);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (!updateError) {
      // Comme X/Facebook : après reset, on revient sur login (re-saisie email + nouveau mdp).
      await supabase.auth.signOut();
    }
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    router.replace('/?password_reset=1');
    router.refresh();
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  if (done) {
    return (
      <Alert>
        <AlertDescription>Mot de passe mis à jour. Redirection vers la connexion…</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmer</Label>
        <PasswordInput
          id="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}

