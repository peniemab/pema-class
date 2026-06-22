'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  canTrustLocalSession,
  clearLocalSession,
  hasSupabaseAuthCookie,
  readLocalSession,
} from '@/lib/offline/local-session';

type Props = {
  children: React.ReactNode;
};

/**
 * Page login : si déjà connecté (cookie ou session locale), redirige
 * vers l'espace sans afficher le formulaire — comme Facebook.
 */
export function LoginSessionGate({ children }: Props) {
  const [phase, setPhase] = useState<'checking' | 'redirect' | 'form'>('checking');

  useEffect(() => {
    const session = readLocalSession();

    if (hasSupabaseAuthCookie()) {
      setPhase('redirect');
      if (session && canTrustLocalSession(session)) {
        window.location.replace(session.homePath);
        return;
      }
      window.location.replace('/post-login');
      return;
    }

    if (canTrustLocalSession(session)) {
      setPhase('redirect');
      window.location.replace(session.homePath);
      return;
    }

    if (session) {
      clearLocalSession();
    }
    setPhase('form');
  }, []);

  if (phase === 'checking' || phase === 'redirect') {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Ouverture de Pema Class…</p>
      </div>
    );
  }

  return <>{children}</>;
}

/** Alerte « session expirée » uniquement si vraiment déconnecté (pas de cookie). */
export function SessionExpiredAlert() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') !== 'session') return;
    if (hasSupabaseAuthCookie()) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <Alert variant="destructive">
      <AlertDescription>
        Session expirée. Reconnectez-vous — vous resterez connecté jusqu&apos;à
        déconnexion volontaire.
      </AlertDescription>
    </Alert>
  );
}
