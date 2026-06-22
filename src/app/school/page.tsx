import { requireSchoolDirection } from '@/lib/auth/require-role';
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
 * Workspace direction. Le tableau de bord (accueil) n'est PAS chargé ici :
 * son squelette s'affiche tout de suite et les chiffres arrivent ensuite
 * (fetch client). On ne charge côté serveur que les snapshots des autres
 * onglets (élèves, caisse, présences) pour leur peinture instantanée.
 */
export default async function SchoolDashboardPage() {
  const { role, schoolId, staffId } = await requireSchoolDirection();

  const [studentsSnapshot, caisseSnapshot, attendanceSnapshot] =
    await Promise.all([
      safe(getStudentsSnapshot(schoolId)),
      safe(getCaisseSnapshot(schoolId)),
      safe(getAttendanceSnapshot(schoolId, staffId, role)),
    ]);

  return (
    <DirectionWorkspace
      role={role}
      schoolId={schoolId}
      staffId={staffId}
      studentsSnapshot={studentsSnapshot}
      caisseSnapshot={caisseSnapshot}
      attendanceSnapshot={attendanceSnapshot}
    />
  );
}
