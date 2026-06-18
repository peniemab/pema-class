import { requireSchoolFinance } from '@/lib/auth/require-role';
import { getCaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import { OfflineCaisseHomeView } from '@/components/school/caisse/offline-caisse-home-view';

export const dynamic = 'force-dynamic';

export default async function AppCaissePage() {
  const { schoolId } = await requireSchoolFinance();

  let initialSnapshot = null;
  try {
    initialSnapshot = await getCaisseSnapshot(schoolId);
  } catch {
    initialSnapshot = null;
  }

  return (
    <OfflineCaisseHomeView
      schoolId={schoolId}
      caisseBasePath="/app/caisse"
      initialSnapshot={initialSnapshot}
    />
  );
}
