'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { StaffRole } from '@/lib/auth/types';
import { DirectionWorkspace } from '@/components/school/mobile/direction-workspace';
import { OfflineSessionGate } from '@/components/offline/offline-session-gate';
import {
  canTrustLocalSession,
  readLocalSession,
  type LocalSession,
} from '@/lib/offline/local-session';

export function DirectionWorkspaceOfflineBoot() {
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
    <DirectionWorkspace
      role={session.role as StaffRole}
      schoolId={session.schoolId}
      staffId={session.staffId}
      studentsSnapshot={null}
      caisseSnapshot={null}
      attendanceSnapshot={null}
    />
  );
}
