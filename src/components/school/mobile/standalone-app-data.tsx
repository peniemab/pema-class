'use client';

import type { StaffRole } from '@/lib/auth/types';
import { AppDataProvider } from '@/lib/offline/app-data-context';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import type { AttendanceSnapshot } from '@/lib/offline/attendance-snapshot';

type Props = {
  schoolId: string;
  staffId: string;
  role: StaffRole;
  studentsSnapshot?: StudentsSnapshot | null;
  caisseSnapshot?: CaisseSnapshot | null;
  attendanceSnapshot?: AttendanceSnapshot | null;
  children: React.ReactNode;
};

/**
 * Fournit le magasin AppData à une route autonome (hors workspace).
 * Permet aux vues offline (élèves, caisse) de fonctionner sur /school/* et
 * les routes directes /app/* avec le même modèle « données en mémoire ».
 */
export function StandaloneAppData({
  schoolId,
  staffId,
  role,
  studentsSnapshot = null,
  caisseSnapshot = null,
  attendanceSnapshot = null,
  children,
}: Props) {
  return (
    <AppDataProvider
      schoolId={schoolId}
      staffId={staffId}
      role={role}
      studentsSnapshot={studentsSnapshot}
      caisseSnapshot={caisseSnapshot}
      attendanceSnapshot={attendanceSnapshot}
    >
      {children}
    </AppDataProvider>
  );
}
