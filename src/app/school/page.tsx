import { tryRequireSchoolDirection } from '@/lib/auth/try-require-role';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { getCaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import { getAttendanceSnapshot } from '@/lib/offline/attendance-snapshot';
import { DirectionWorkspace } from '@/components/school/mobile/direction-workspace';
import { DirectionWorkspaceOfflineBoot } from '@/components/offline/direction-workspace-offline-boot';
import { PersistLocalSession } from '@/components/offline/persist-local-session';

export const dynamic = 'force-dynamic';

async function safe<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

/**
 * Workspace direction. Boot offline si auth serveur indisponible.
 */
export default async function SchoolDashboardPage() {
  const ctx = await tryRequireSchoolDirection();
  if (!ctx) {
    return <DirectionWorkspaceOfflineBoot />;
  }

  const [studentsSnapshot, caisseSnapshot, attendanceSnapshot] =
    await Promise.all([
      safe(getStudentsSnapshot(ctx.schoolId)),
      safe(getCaisseSnapshot(ctx.schoolId)),
      safe(getAttendanceSnapshot(ctx.schoolId, ctx.staffId, ctx.role)),
    ]);

  return (
    <>
      <PersistLocalSession auth={ctx} />
      <DirectionWorkspace
        role={ctx.role}
        schoolId={ctx.schoolId}
        staffId={ctx.staffId}
        studentsSnapshot={studentsSnapshot}
        caisseSnapshot={caisseSnapshot}
        attendanceSnapshot={attendanceSnapshot}
      />
    </>
  );
}
