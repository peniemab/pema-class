import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getDashboardPageData } from '@/lib/db/dashboard-page';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { getCaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import { getAttendanceSnapshot } from '@/lib/offline/attendance-snapshot';
import { DirectionWorkspace } from '@/components/school/mobile/direction-workspace';

export const dynamic = 'force-dynamic';

async function safe<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

/**
 * Workspace direction : dashboard + snapshots chargés en parallèle côté
 * serveur (rapide grâce aux index). Le client peint instantanément et
 * garde tous les onglets en mémoire (modèle WhatsApp).
 */
export default async function SchoolDashboardPage() {
  const { role, schoolId, staffId } = await requireSchoolDirection();

  const [dashboard, studentsSnapshot, caisseSnapshot, attendanceSnapshot] =
    await Promise.all([
      getDashboardPageData(schoolId),
      safe(getStudentsSnapshot(schoolId)),
      safe(getCaisseSnapshot(schoolId)),
      safe(getAttendanceSnapshot(schoolId, staffId, role)),
    ]);

  return (
    <DirectionWorkspace
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
