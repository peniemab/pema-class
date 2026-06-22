import { requireSchoolStaff } from '@/lib/auth/require-role';
import { getDashboardPageData, type DashboardPageData } from '@/lib/db/dashboard-page';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listTeacherClassIds } from '@/lib/db/teacher-classes';
import { getTeacherImpayesSummary } from '@/lib/db/teacher-impayes-page';
import type { StaffRole } from '@/lib/auth/types';

export type StaffDashboardPageData = DashboardPageData & {
  teacherClassCount?: number;
  teacherStudentsWithDebt?: number;
};

export async function loadStaffDashboardForAuth(ctx: {
  schoolId: string;
  staffId: string;
  role: StaffRole;
}): Promise<StaffDashboardPageData> {
  const { schoolId, staffId, role } = ctx;
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

export async function loadStaffDashboardPage() {
  const ctx = await requireSchoolStaff();
  return loadStaffDashboardForAuth(ctx);
}
