import { cache } from 'react';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listClassesForYear } from '@/lib/db/classes';
import { listFeesForAcademicYearLabel } from '@/lib/db/fees';
import { listEnrolledStudentsForYear } from '@/lib/db/enrolled-students';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  applyScolaritePoolToBalances,
  buildRawStudentFeeBalances,
} from '@/lib/school/scolarite-balances';
import {
  getSchoolFeeCurrencies,
  type FeeCurrency,
} from '@/lib/school/fee-currencies';

export type DashboardPageData = {
  schoolName: string;
  activeYear: { id: string; name: string } | null;
  enrolledCount: number;
  classCount: number;
  studentsWithDebt: number;
  feeCurrencies: FeeCurrency[];
  totalCollectedCdf: number;
  totalCollectedUsd: number;
  totalExpectedCdf: number;
  totalExpectedUsd: number;
  totalUnpaidCdf: number;
  totalUnpaidUsd: number;
  recoveryRateCdf: number;
  recoveryRateUsd: number;
};

function studentDisplayBalances(
  studentId: string,
  fees: { id: string; name: string; amount: number; currency: string }[],
  paidByStudentFee: Map<string, number>,
) {
  const paidByFee = new Map<string, number>();
  for (const fee of fees) {
    const paid = paidByStudentFee.get(`${studentId}:${fee.id}`) ?? 0;
    if (paid > 0) paidByFee.set(fee.id, paid);
  }
  const raw = buildRawStudentFeeBalances(fees, paidByFee);
  return applyScolaritePoolToBalances(raw).balances;
}

async function fetchDashboardPageData(
  schoolId: string,
): Promise<DashboardPageData> {
  const { getSchoolByIdForStaff } = await import('@/lib/db/schools');
  const school = await getSchoolByIdForStaff(schoolId);
  const activeYear = await getActiveAcademicYear(schoolId);

  const empty: DashboardPageData = {
    schoolName: school?.display_name ?? school?.name ?? 'Établissement',
    activeYear: activeYear
      ? { id: activeYear.id, name: activeYear.name }
      : null,
    enrolledCount: 0,
    classCount: 0,
    studentsWithDebt: 0,
    totalCollectedCdf: 0,
    totalCollectedUsd: 0,
    totalExpectedCdf: 0,
    totalExpectedUsd: 0,
    totalUnpaidCdf: 0,
    totalUnpaidUsd: 0,
    recoveryRateCdf: 0,
    recoveryRateUsd: 0,
    feeCurrencies: [],
  };

  if (!activeYear) return empty;

  const [fees, classes, enrolled] = await Promise.all([
    listFeesForAcademicYearLabel(schoolId, activeYear.name),
    listClassesForYear(schoolId, activeYear.id),
    listEnrolledStudentsForYear(schoolId, activeYear.id),
  ]);

  empty.enrolledCount = enrolled.length;
  empty.classCount = classes.length;
  empty.feeCurrencies = getSchoolFeeCurrencies(fees);

  if (fees.length === 0 || enrolled.length === 0) return empty;

  const feeIds = fees.map((f) => f.id);
  const studentIds = enrolled.map((s) => s.id);
  const admin = createAdminClient();

  const { data: paymentRows, error: payError } = await admin
    .from('payments_history')
    .select('student_id, fee_id, amount_paid')
    .in('fee_id', feeIds)
    .in('student_id', studentIds);
  if (payError) throw new Error(payError.message);

  const paidByStudentFee = new Map<string, number>();
  for (const row of paymentRows ?? []) {
    const raw = row as { student_id: string; fee_id: string; amount_paid: number };
    const key = `${raw.student_id}:${raw.fee_id}`;
    paidByStudentFee.set(
      key,
      (paidByStudentFee.get(key) ?? 0) + Number(raw.amount_paid),
    );
  }

  const studentsWithDebt = new Set<string>();

  for (const student of enrolled) {
    const balances = studentDisplayBalances(
      student.id,
      fees,
      paidByStudentFee,
    );
    let hasDebt = false;
    for (const line of balances) {
      if (line.currency === 'USD') {
        empty.totalCollectedUsd += line.amount_paid;
        empty.totalExpectedUsd += line.amount_due;
        empty.totalUnpaidUsd += line.amount_remaining;
      } else {
        empty.totalCollectedCdf += line.amount_paid;
        empty.totalExpectedCdf += line.amount_due;
        empty.totalUnpaidCdf += line.amount_remaining;
      }
      if (line.amount_remaining > 0.001) hasDebt = true;
    }
    if (hasDebt) studentsWithDebt.add(student.id);
  }

  empty.studentsWithDebt = studentsWithDebt.size;
  empty.recoveryRateCdf =
    empty.totalExpectedCdf > 0
      ? (empty.totalCollectedCdf / empty.totalExpectedCdf) * 100
      : 0;
  empty.recoveryRateUsd =
    empty.totalExpectedUsd > 0
      ? (empty.totalCollectedUsd / empty.totalExpectedUsd) * 100
      : 0;

  return empty;
}

export const getDashboardPageData = cache(fetchDashboardPageData);
