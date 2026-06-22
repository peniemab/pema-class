import { requireSchoolStaff } from '@/lib/auth/require-role';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { OfflineStudentsView } from '@/components/school/students/offline-students-view';
import { StandaloneAppData } from '@/components/school/mobile/standalone-app-data';
import { APP_STUDENTS_BASE } from '@/lib/navigation/students-paths';

export const dynamic = 'force-dynamic';

export default async function AppElevesPage() {
  const { schoolId, staffId, role } = await requireSchoolStaff();

  let studentsSnapshot = null;
  try {
    studentsSnapshot = await getStudentsSnapshot(schoolId);
  } catch {
    studentsSnapshot = null;
  }

  return (
    <StandaloneAppData
      schoolId={schoolId}
      staffId={staffId}
      role={role}
      studentsSnapshot={studentsSnapshot}
    >
      <OfflineStudentsView studentsBase={APP_STUDENTS_BASE} />
    </StandaloneAppData>
  );
}
