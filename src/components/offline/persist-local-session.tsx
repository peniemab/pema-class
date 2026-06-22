'use client';

import { useEffect } from 'react';
import type { StaffAuthContext } from '@/lib/auth/try-require-role';
import type { StaffDashboardPageData } from '@/lib/school/load-staff-dashboard-page';
import {
  homePathForRole,
  writeLocalSession,
  type LocalSessionInput,
} from '@/lib/offline/local-session';

type Props = {
  auth: StaffAuthContext;
  schoolName?: string;
  staffDashboard?: StaffDashboardPageData;
};

/** Enregistre la session locale après une auth serveur réussie (style WhatsApp). */
export function PersistLocalSession({
  auth,
  schoolName,
  staffDashboard,
}: Props) {
  useEffect(() => {
    const payload: LocalSessionInput = {
      userId: auth.userId,
      staffId: auth.staffId,
      schoolId: auth.schoolId,
      role: auth.role,
      homePath: homePathForRole(auth.role),
      email: auth.email,
      schoolName,
      staffDashboard,
    };
    writeLocalSession(payload);
  }, [auth, schoolName, staffDashboard]);

  return null;
}
