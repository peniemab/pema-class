'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/auth/callback?next=/auth/reset-password`;
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);

    if (!isSupabaseConfigured()) {
      setError(
        'Configuration Supabase manquante (.env.local : NEXT_PUBLIC_SUPABASE_URL et clé publishable).',
      );
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      redirectTo ? { redirectTo } : undefined,
    );
    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {sent ? (
        <Alert>
          <AlertDescription>
            Si un compte existe pour <span className="font-medium">{email.trim()}</span>, un
            e-mail a été envoyé avec un lien de réinitialisation.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Envoi…' : 'Envoyer le lien'}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}

