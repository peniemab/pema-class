import { tryRequireSchoolStaff } from '@/lib/auth/try-require-role';
import {
  ATTENDANCE_ROLES,
  ENROLLMENT_ROLES,
  FINANCE_ROLES,
  OFFICE_STAFF_ROLES,
} from '@/lib/auth/types';
import { loadStaffDashboardForAuth, type StaffDashboardPageData } from '@/lib/school/load-staff-dashboard-page';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { getCaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import { getAttendanceSnapshot } from '@/lib/offline/attendance-snapshot';
import { StaffWorkspace } from '@/components/school/mobile/staff-workspace';
import { StaffWorkspaceOfflineBoot } from '@/components/offline/staff-workspace-offline-boot';
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
 * Charge tout en parallèle côté serveur (rapide grâce aux index SQL) :
 * dashboard + snapshots. Le client (AppDataProvider) peint instantanément
 * depuis ces données puis rafraîchit en fond.
 * Si le serveur est injoignable, boot depuis session locale + Dexie.
 */
export default async function StaffAppPage() {
  const ctx = await tryRequireSchoolStaff();
  if (!ctx) {
    return <StaffWorkspaceOfflineBoot />;
  }

  const canEleves =
    ENROLLMENT_ROLES.includes(ctx.role) && OFFICE_STAFF_ROLES.includes(ctx.role);
  const canPresences = ATTENDANCE_ROLES.includes(ctx.role);
  const canCaisse = FINANCE_ROLES.includes(ctx.role);
  const needStudentsCache = canEleves || canPresences;

  const dashboard = await safe<StaffDashboardPageData>(
    loadStaffDashboardForAuth(ctx),
  );
  if (!dashboard) {
    return <StaffWorkspaceOfflineBoot />;
  }

  const [studentsSnapshot, caisseSnapshot, attendanceSnapshot] =
    await Promise.all([
      needStudentsCache
        ? safe(getStudentsSnapshot(ctx.schoolId))
        : Promise.resolve(null),
      canCaisse ? safe(getCaisseSnapshot(ctx.schoolId)) : Promise.resolve(null),
      canPresences
        ? safe(getAttendanceSnapshot(ctx.schoolId, ctx.staffId, ctx.role))
        : Promise.resolve(null),
    ]);

  return (
    <>
      <PersistLocalSession
        auth={ctx}
        schoolName={dashboard.schoolName}
        staffDashboard={dashboard}
      />
      <StaffWorkspace
        role={ctx.role}
        schoolId={ctx.schoolId}
        staffId={ctx.staffId}
        dashboard={dashboard}
        studentsSnapshot={studentsSnapshot}
        caisseSnapshot={caisseSnapshot}
        attendanceSnapshot={attendanceSnapshot}
      />
    </>
  );
}
