import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getDashboardPageData } from '@/lib/db/dashboard-page';

export async function loadDashboardPage() {
  const { schoolId } = await requireSchoolDirection();
  return getDashboardPageData(schoolId);
}
