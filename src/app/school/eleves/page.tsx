import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { OfflineStudentsView } from '@/components/school/students/offline-students-view';
import { StandaloneAppData } from '@/components/school/mobile/standalone-app-data';

export const dynamic = 'force-dynamic';

export default async function SchoolElevesPage() {
  const { schoolId, staffId, role } = await requireSchoolDirection();

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
      <OfflineStudentsView />
    </StandaloneAppData>
  );
}
