import { requireSchoolStaff } from '@/lib/auth/require-role';
import { loadStaffDashboardPage } from '@/lib/school/load-staff-dashboard-page';
import { StaffWorkspace } from '@/components/school/mobile/staff-workspace';

export const dynamic = 'force-dynamic';

/**
 * Shell léger type WhatsApp Web :
 * - serveur : auth + dashboard accueil uniquement
 * - autres onglets : lazy client + prefetch idle en arrière-plan
 */
export default async function StaffAppPage() {
  const { role, schoolId, staffId } = await requireSchoolStaff();
  const dashboard = await loadStaffDashboardPage();

  return (
    <StaffWorkspace
      role={role}
      schoolId={schoolId}
      staffId={staffId}
      dashboard={dashboard}
    />
  );
}
