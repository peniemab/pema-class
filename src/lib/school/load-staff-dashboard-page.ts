import { requireSchoolStaff } from '@/lib/auth/require-role';
import { getDashboardPageData } from '@/lib/db/dashboard-page';

export async function loadStaffDashboardPage() {
  const { schoolId } = await requireSchoolStaff();
  return getDashboardPageData(schoolId);
}
