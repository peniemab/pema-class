'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { StaffRole } from '@/lib/auth/types';
import { StaffWorkspace } from '@/components/school/mobile/staff-workspace';
import { OfflineSessionGate } from '@/components/offline/offline-session-gate';
import {
  canTrustLocalSession,
  emptyStaffDashboard,
  readLocalSession,
  type LocalSession,
} from '@/lib/offline/local-session';

export function StaffWorkspaceOfflineBoot() {
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

  const dashboard =
    session.staffDashboard ??
    emptyStaffDashboard(session.schoolName ?? 'Établissement');

  return (
    <StaffWorkspace
      role={session.role as StaffRole}
      schoolId={session.schoolId}
      staffId={session.staffId}
      dashboard={dashboard}
      studentsSnapshot={null}
      caisseSnapshot={null}
      attendanceSnapshot={null}
    />
  );
}
