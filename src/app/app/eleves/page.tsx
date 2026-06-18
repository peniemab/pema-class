import { requireSchoolStaff } from '@/lib/auth/require-role';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { OfflineStudentsView } from '@/components/school/students/offline-students-view';
import { APP_STUDENTS_BASE } from '@/lib/navigation/students-paths';

export const dynamic = 'force-dynamic';

export default async function AppElevesPage() {
  const { schoolId } = await requireSchoolStaff();

  let initialSnapshot = null;
  try {
    initialSnapshot = await getStudentsSnapshot(schoolId);
  } catch {
    initialSnapshot = null;
  }

  return (
    <OfflineStudentsView
      schoolId={schoolId}
      initialSnapshot={initialSnapshot}
      studentsBase={APP_STUDENTS_BASE}
    />
  );
}
