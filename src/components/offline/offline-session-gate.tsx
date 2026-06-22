'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  canTrustLocalSession,
  clearLocalSession,
  readLocalSession,
  type LocalSession,
} from '@/lib/offline/local-session';
import { cn } from '@/lib/utils';

type Props = {
  expectedHome: '/app' | '/school';
};

export function OfflineSessionGate({ expectedHome }: Props) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readLocalSession();
    setSession(stored);
    setReady(true);

    if (canTrustLocalSession(stored) && stored.homePath === expectedHome) {
      window.location.replace(expectedHome);
      return;
    }
    if (stored && !canTrustLocalSession(stored)) {
      clearLocalSession();
    }
  }, [expectedHome]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Chargement…
      </div>
    );
  }

  if (canTrustLocalSession(session) && session.homePath === expectedHome) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Ouverture de votre espace…
      </div>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Session requise</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Connectez-vous une fois pour accéder à Pema Class. Votre session restera
        active jusqu&apos;à déconnexion volontaire.
      </p>
      <Link href="/" className={cn(buttonVariants({ size: 'lg' }))}>
        Se connecter
      </Link>
    </main>
  );
}
