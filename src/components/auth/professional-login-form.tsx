'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { brand } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/ui/password-input';
import Link from 'next/link';

export function ProfessionalLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError(
        'Configuration Supabase manquante (.env.local : NEXT_PUBLIC_SUPABASE_URL et clé publishable).',
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
      setError('E-mail ou mot de passe incorrect.');
      return;
    }

    router.push('/post-login');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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
          required
        />
      </div>
      <Button type="submit" className="w-full gap-2" disabled={submitting}>
        {submitting ? 'Connexion…' : 'Se connecter'}
        {!submitting && <ArrowRight className="size-4" aria-hidden />}
      </Button>

      <div className="text-center text-sm">
        <Link
          href="/auth/forgot-password"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>
    </form>
  );
}
