'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { OfflineModeBanner } from '@/components/offline/offline-mode-banner';
import { OfflineSessionGate } from '@/components/offline/offline-session-gate';
import {
  canTrustLocalSession,
  readLocalSession,
  type LocalSession,
} from '@/lib/offline/local-session';

type Props = {
  children: React.ReactNode;
};

export function DirectionOfflineShell({ children }: Props) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readLocalSession());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!canTrustLocalSession(session) || session.homePath !== '/school') {
    return <OfflineSessionGate expectedHome="/school" />;
  }

  return (
    <>
      <OfflineModeBanner />
      <AppShell variant="school">{children}</AppShell>
    </>
  );
}
