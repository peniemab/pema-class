import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { OfflineEnrollView } from '@/components/school/students/offline-enroll-view';

export const dynamic = 'force-dynamic';

export default async function EnrollStudentPage() {
  const { schoolId } = await requireSchoolDirection();

  let initialSnapshot = null;
  try {
    initialSnapshot = await getStudentsSnapshot(schoolId);
  } catch {
    initialSnapshot = null;
  }

  return (
    <OfflineEnrollView schoolId={schoolId} initialSnapshot={initialSnapshot} />
  );
}
