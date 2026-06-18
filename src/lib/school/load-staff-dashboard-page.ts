import { requireSchoolStaff } from '@/lib/auth/require-role';
import { getDashboardPageData } from '@/lib/db/dashboard-page';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listTeacherClassIds } from '@/lib/db/teacher-classes';
import { getTeacherImpayesSummary } from '@/lib/db/teacher-impayes-page';

export type StaffDashboardPageData = Awaited<
  ReturnType<typeof loadStaffDashboardPage>
>;

export async function loadStaffDashboardPage() {
  const { schoolId, staffId, role } = await requireSchoolStaff();
  const data = await getDashboardPageData(schoolId);

  if (role !== 'enseignant') {
    return { ...data, teacherClassCount: undefined, teacherStudentsWithDebt: undefined };
  }

  const activeYear = await getActiveAcademicYear(schoolId);
  const classIds = activeYear
    ? await listTeacherClassIds(schoolId, activeYear.id, staffId)
    : [];
  const { studentsWithDebt } = await getTeacherImpayesSummary(schoolId, staffId);

  return {
    ...data,
    teacherClassCount: classIds.length,
    teacherStudentsWithDebt: studentsWithDebt,
  };
}
