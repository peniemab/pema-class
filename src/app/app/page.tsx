import { requireSchoolStaff } from '@/lib/auth/require-role';
import {
  ATTENDANCE_ROLES,
  ENROLLMENT_ROLES,
  FINANCE_ROLES,
  OFFICE_STAFF_ROLES,
} from '@/lib/auth/types';
import { loadStaffDashboardPage } from '@/lib/school/load-staff-dashboard-page';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { getCaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import { getAttendanceSnapshot } from '@/lib/offline/attendance-snapshot';
import { StaffWorkspace } from '@/components/school/mobile/staff-workspace';

export const dynamic = 'force-dynamic';

async function safe<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

/**
 * Charge tout en parallèle côté serveur (rapide grâce aux index SQL) :
 * dashboard + snapshots. Le client (AppDataProvider) peint instantanément
 * depuis ces données puis rafraîchit en fond.
 */
export default async function StaffAppPage() {
  const { role, schoolId, staffId } = await requireSchoolStaff();

  const canEleves =
    ENROLLMENT_ROLES.includes(role) && OFFICE_STAFF_ROLES.includes(role);
  const canPresences = ATTENDANCE_ROLES.includes(role);
  const canCaisse = FINANCE_ROLES.includes(role);
  const needStudentsCache = canEleves || canPresences;

  const [dashboard, studentsSnapshot, caisseSnapshot, attendanceSnapshot] =
    await Promise.all([
      loadStaffDashboardPage(),
      needStudentsCache
        ? safe(getStudentsSnapshot(schoolId))
        : Promise.resolve(null),
      canCaisse ? safe(getCaisseSnapshot(schoolId)) : Promise.resolve(null),
      canPresences
        ? safe(getAttendanceSnapshot(schoolId, staffId, role))
        : Promise.resolve(null),
    ]);

  return (
    <StaffWorkspace
      role={role}
      schoolId={schoolId}
      staffId={staffId}
      dashboard={dashboard}
      studentsSnapshot={studentsSnapshot}
      caisseSnapshot={caisseSnapshot}
      attendanceSnapshot={attendanceSnapshot}
    />
  );
}
