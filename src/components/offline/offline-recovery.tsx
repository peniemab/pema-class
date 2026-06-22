'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { buttonVariants } from '@/components/ui/button';
import {
  canTrustLocalSession,
  readLocalSession,
} from '@/lib/offline/local-session';
import { cn } from '@/lib/utils';

/** Page /~offline : tente de rouvrir le workspace si session locale valide. */
export function OfflineRecovery() {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const session = readLocalSession();
    if (canTrustLocalSession(session)) {
      setRedirecting(true);
      window.location.replace(session.homePath);
    }
  }, []);

  if (redirecting) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <BrandMark orientation="center" />
        <p className="text-sm text-muted-foreground">Ouverture de Pema Class…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <BrandMark orientation="center" />
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">Vous êtes hors ligne</h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous une fois en ligne pour activer l&apos;accès hors ligne.
          Ensuite, Pema Class restera ouvert jusqu&apos;à déconnexion volontaire.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants({ size: 'lg' }))}>
        Réessayer
      </Link>
    </main>
  );
}
