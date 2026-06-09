import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStudentById, getStudentEnrollmentForYear } from '@/lib/db/students';
import { getActiveAcademicYearLite } from '@/lib/db/academic-years';
import { getStudentFinanceForYear } from '@/lib/db/payments';
import type { PaymentHistoryRow, StudentFeeBalance } from '@/lib/db/payments';
import type { ScolaritePoolSummary } from '@/lib/school/scolarite-balances';
import type { StudentEnrollmentRow, StudentRow } from '@/lib/db/students';

export type CaisseStudentPageData = {
  activeYear: { id: string; name: string } | null;
  student: StudentRow;
  enrollment: StudentEnrollmentRow | null;
  balances: StudentFeeBalance[];
  payments: PaymentHistoryRow[];
  scolariteSummary: ScolaritePoolSummary | null;
  caisseBasePath: '/school/caisse' | '/app/caisse';
};

async function fetchCaisseStudentPageData(
  schoolId: string,
  studentId: string,
  caisseBasePath: '/school/caisse' | '/app/caisse',
): Promise<CaisseStudentPageData | null> {
  const [student, activeYear] = await Promise.all([
    getStudentById(schoolId, studentId),
    getActiveAcademicYearLite(schoolId),
  ]);
  if (!student) return null;

  if (!activeYear) {
    return {
      activeYear: null,
      student,
      enrollment: null,
      balances: [],
      payments: [],
      scolariteSummary: null,
      caisseBasePath,
    };
  }

  const [enrollment, finance] = await Promise.all([
    getStudentEnrollmentForYear(schoolId, studentId, activeYear.id),
    getStudentFinanceForYear(schoolId, studentId, activeYear.name),
  ]);

  return {
    activeYear,
    student,
    enrollment,
    balances: finance.balances,
    payments: finance.payments,
    scolariteSummary: finance.scolariteSummary,
    caisseBasePath,
  };
}

export const getCaisseStudentPageData = cache(fetchCaisseStudentPageData);
