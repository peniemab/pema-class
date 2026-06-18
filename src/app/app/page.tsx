import { requireSchoolStaff } from '@/lib/auth/require-role';
import { loadStaffDashboardPage } from '@/lib/school/load-staff-dashboard-page';
import { StaffDashboard } from '@/components/school/staff-dashboard';

export default async function StaffAppPage() {
  const { role } = await requireSchoolStaff();
  const data = await loadStaffDashboardPage();
  return <StaffDashboard data={data} role={role} />;
}
