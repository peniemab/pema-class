import { requireSchoolFinance } from '@/lib/auth/require-role';
import { getCaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import { OfflineCaisseHomeView } from '@/components/school/caisse/offline-caisse-home-view';
import { StandaloneAppData } from '@/components/school/mobile/standalone-app-data';

export const dynamic = 'force-dynamic';

export default async function SchoolCaissePage() {
  const { schoolId, staffId, role } = await requireSchoolFinance();

  let caisseSnapshot = null;
  try {
    caisseSnapshot = await getCaisseSnapshot(schoolId);
  } catch {
    caisseSnapshot = null;
  }

  return (
    <StandaloneAppData
      schoolId={schoolId}
      staffId={staffId}
      role={role}
      caisseSnapshot={caisseSnapshot}
    >
      <OfflineCaisseHomeView caisseBasePath="/school/caisse" />
    </StandaloneAppData>
  );
}
