import { requireSchoolFinance } from '@/lib/auth/require-role';
import { getCaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import { OfflineCaisseStudentView } from '@/components/school/caisse/offline-caisse-student-view';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ nouveau?: string }>;
};

export default async function AppCaisseStudentPage({
  params,
  searchParams,
}: Props) {
  const { schoolId } = await requireSchoolFinance();
  const { studentId } = await params;
  const { nouveau } = await searchParams;

  let initialSnapshot = null;
  try {
    initialSnapshot = await getCaisseSnapshot(schoolId);
  } catch {
    initialSnapshot = null;
  }

  return (
    <OfflineCaisseStudentView
      schoolId={schoolId}
      studentId={studentId}
      caisseBasePath="/app/caisse"
      isNewEnrollment={nouveau === '1'}
      initialSnapshot={initialSnapshot}
    />
  );
}
