import { requireSchoolStaff } from '@/lib/auth/require-role';
import { getTeacherImpayesPageData } from '@/lib/db/teacher-impayes-page';

export async function loadTeacherImpayesPage(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId, staffId } = await requireSchoolStaff();
  return getTeacherImpayesPageData(schoolId, staffId, searchParams);
}
