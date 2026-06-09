import { loadDashboardPage } from '@/lib/school/load-dashboard-page';
import { SchoolDashboard } from '@/components/school/school-dashboard';

export default async function SchoolDashboardPage() {
  const data = await loadDashboardPage();
  return <SchoolDashboard data={data} />;
}
