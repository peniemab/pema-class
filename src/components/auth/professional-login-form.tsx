'use client';

import { FormEvent, useRef, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { brand } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/ui/password-input';
import Link from 'next/link';

type LoginPhase = 'idle' | 'signing-in' | 'redirecting';

export function ProfessionalLoginForm() {
  const inFlight = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<LoginPhase>('idle');

  const busy = phase !== 'idle';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current || busy) return;

    setError(null);

    if (!isSupabaseConfigured()) {
      setError(
        'Configuration Supabase manquante (.env.local : NEXT_PUBLIC_SUPABASE_URL et clé publishable).',
      );
      return;
    }

    inFlight.current = true;
    setPhase('signing-in');

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError('E-mail ou mot de passe incorrect.');
        setPhase('idle');
        inFlight.current = false;
        return;
      }

      setPhase('redirecting');
      // Laisse le temps aux cookies Supabase d'être écrits avant la navigation serveur.
      await new Promise((r) => setTimeout(r, 150));
      window.location.assign('/post-login');
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
      setPhase('idle');
      inFlight.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={busy}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {phase === 'redirecting' && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Session ouverte — redirection vers votre espace…
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={brand.login.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          required
        />
      </div>
      <Button type="submit" className="w-full gap-2" disabled={busy}>
        {phase === 'signing-in' && (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Connexion en cours…
          </>
        )}
        {phase === 'redirecting' && (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Ouverture de l&apos;application…
          </>
        )}
        {phase === 'idle' && (
          <>
            Se connecter
            <ArrowRight className="size-4" aria-hidden />
          </>
        )}
      </Button>

      <div className="text-center text-sm">
        <Link
          href="/auth/forgot-password"
          className="font-medium text-primary underline-offset-4 hover:underline"
          tabIndex={busy ? -1 : undefined}
          aria-disabled={busy}
        >
          Mot de passe oublié ?
        </Link>
      </div>
    </form>
  );
}
