import { requireSchoolStaff } from '@/lib/auth/require-role';
import {
  ATTENDANCE_ROLES,
  ENROLLMENT_ROLES,
  FINANCE_ROLES,
  OFFICE_STAFF_ROLES,
} from '@/lib/auth/types';
import { loadStaffDashboardPage } from '@/lib/school/load-staff-dashboard-page';
import { loadAttendancePage } from '@/lib/school/attendance-actions';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { getCaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import { StaffWorkspace } from '@/components/school/mobile/staff-workspace';

export const dynamic = 'force-dynamic';

async function safe<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export default async function StaffAppPage() {
  const { role, schoolId } = await requireSchoolStaff();

  const canEleves =
    ENROLLMENT_ROLES.includes(role) && OFFICE_STAFF_ROLES.includes(role);
  const canPresences = ATTENDANCE_ROLES.includes(role);
  const canCaisse = FINANCE_ROLES.includes(role);

  const [dashboard, studentsSnapshot, caisseSnapshot, attendance] =
    await Promise.all([
      loadStaffDashboardPage(),
      canEleves ? safe(getStudentsSnapshot(schoolId)) : Promise.resolve(null),
      canCaisse ? safe(getCaisseSnapshot(schoolId)) : Promise.resolve(null),
      canPresences
        ? safe(loadAttendancePage({}, '/app/presences'))
        : Promise.resolve(null),
    ]);

  return (
    <StaffWorkspace
      role={role}
      schoolId={schoolId}
      dashboard={dashboard}
      studentsSnapshot={studentsSnapshot}
      caisseSnapshot={caisseSnapshot}
      attendance={attendance}
    />
  );
}
