'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { StaffRole } from '@/lib/auth/types';
import { StaffShellMain } from '@/components/school/mobile/staff-shell-main';
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

export function StaffOfflineShell({ children }: Props) {
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

  if (!canTrustLocalSession(session) || session.homePath !== '/app') {
    return <OfflineSessionGate expectedHome="/app" />;
  }

  return (
    <>
      <OfflineModeBanner />
      <StaffShellMain role={session.role as StaffRole}>{children}</StaffShellMain>
    </>
  );
}
