'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { StaffOfflineShell } from '@/components/offline/staff-offline-shell';
import { DirectionOfflineShell } from '@/components/offline/direction-offline-shell';
import { StaffWorkspaceOfflineBoot } from '@/components/offline/staff-workspace-offline-boot';
import { DirectionWorkspaceOfflineBoot } from '@/components/offline/direction-workspace-offline-boot';
import { OfflineSessionGate } from '@/components/offline/offline-session-gate';
import {
  canTrustLocalSession,
  hasSupabaseAuthCookie,
  readLocalSession,
  syncBootCookieFromLocalSession,
  type LocalSession,
} from '@/lib/offline/local-session';

/**
 * Point d'entrée PWA (WhatsApp) : ouvre l'app hors ligne avec le workspace
 * complet depuis la session locale + Dexie. En ligne → redirection directe.
 */
export function OfflineAppBoot() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [phase, setPhase] = useState<'loading' | 'redirect' | 'workspace'>('loading');

  useEffect(() => {
    const stored = readLocalSession();
    syncBootCookieFromLocalSession();
    setSession(stored);

    if (!stored) {
      window.location.replace('/');
      return;
    }

    if (navigator.onLine && hasSupabaseAuthCookie()) {
      setPhase('redirect');
      window.location.replace(stored.homePath);
      return;
    }

    if (!canTrustLocalSession(stored)) {
      window.location.replace('/');
      return;
    }

    setPhase('workspace');
  }, []);

  if (phase === 'loading' || phase === 'redirect') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-wa-bg">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Ouverture de Pema Class…</p>
      </div>
    );
  }

  if (!session) return null;

  if (session.homePath === '/school') {
    return (
      <DirectionOfflineShell>
        <DirectionWorkspaceOfflineBoot />
      </DirectionOfflineShell>
    );
  }

  if (session.homePath === '/app') {
    return (
      <StaffOfflineShell>
        <StaffWorkspaceOfflineBoot />
      </StaffOfflineShell>
    );
  }

  if (navigator.onLine) {
    window.location.replace(session.homePath);
    return null;
  }

  return <OfflineSessionGate expectedHome="/app" />;
}
