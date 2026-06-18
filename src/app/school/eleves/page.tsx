import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';
import { OfflineStudentsView } from '@/components/school/students/offline-students-view';

export const dynamic = 'force-dynamic';

export default async function SchoolElevesPage() {
  const { schoolId } = await requireSchoolDirection();

  // Amorce le premier rendu (peinture instantanée en ligne) ; le client
  // bascule ensuite sur le cache local IndexedDB + sync en arrière-plan.
  let initialSnapshot = null;
  try {
    initialSnapshot = await getStudentsSnapshot(schoolId);
  } catch {
    initialSnapshot = null;
  }

  return (
    <OfflineStudentsView schoolId={schoolId} initialSnapshot={initialSnapshot} />
  );
}
