'use server';

import { revalidatePath } from 'next/cache';
import { requireSchoolFinance, requireSchoolDirection } from '@/lib/auth/require-role';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import {
  listStudentFeeBalances,
  listStudentPayments,
  recordPayment,
  type PaymentHistoryRow,
  type StudentFeeBalance,
} from '@/lib/db/payments';
import {
  getStudentById,
  getStudentEnrollmentForYear,
  type StudentEnrollmentRow,
  type StudentRow,
} from '@/lib/db/students';

export type ActionResult =
  | {
      ok: true;
      message?: string;
      receiptNumber?: string;
      paymentId?: string;
      amountPaid?: number;
      currency?: string;
      feeName?: string;
    }
  | { ok: false; error: string };

export type CaisseStudentPageData = {
  activeYear: { id: string; name: string } | null;
  student: StudentRow;
  enrollment: StudentEnrollmentRow | null;
  balances: StudentFeeBalance[];
  payments: PaymentHistoryRow[];
  caisseBasePath: string;
};

function revalidateCaisse(studentId: string, caisseBasePath: string) {
  revalidatePath(caisseBasePath);
  revalidatePath(`${caisseBasePath}/${studentId}`);
  revalidatePath('/school/eleves');
  revalidatePath(`/school/eleves/${studentId}`);
  revalidatePath('/print/recu');
  revalidatePath('/print/inscription');
}

export async function loadCaisseStudentPage(
  studentId: string,
  caisseBasePath: '/school/caisse' | '/app/caisse',
): Promise<CaisseStudentPageData | null> {
  const { schoolId } = await requireSchoolFinance();
  const student = await getStudentById(schoolId, studentId);
  if (!student) return null;

  const activeYear = await getActiveAcademicYear(schoolId);
  const [enrollment, balances, payments] = await Promise.all([
    activeYear
      ? getStudentEnrollmentForYear(schoolId, studentId, activeYear.id)
      : Promise.resolve(null),
    activeYear
      ? listStudentFeeBalances(schoolId, studentId, activeYear.name)
      : Promise.resolve([]),
    activeYear
      ? listStudentPayments(schoolId, studentId, activeYear.name)
      : Promise.resolve([]),
  ]);

  return {
    activeYear: activeYear
      ? { id: activeYear.id, name: activeYear.name }
      : null,
    student,
    enrollment,
    balances,
    payments,
    caisseBasePath,
  };
}

export async function recordPaymentAction(input: {
  studentId: string;
  feeId: string;
  caisseBasePath: '/school/caisse' | '/app/caisse';
}): Promise<ActionResult> {
  try {
    const { userId, schoolId } = await requireSchoolFinance();
    const result = await recordPayment({
      schoolId,
      studentId: input.studentId,
      feeId: input.feeId,
      userId,
    });

    revalidateCaisse(input.studentId, input.caisseBasePath);

    return {
      ok: true,
      message: `Paiement enregistré — ${result.feeName}`,
      feeName: result.feeName,
      receiptNumber: result.receiptNumber,
      paymentId: result.paymentId,
      amountPaid: result.amountPaid,
      currency: result.currency,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Encaissement impossible.',
    };
  }
}

export async function loadStudentFeesSummary(studentId: string) {
  const { schoolId } = await requireSchoolDirection();
  const student = await getStudentById(schoolId, studentId);
  if (!student) return null;

  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return { student, activeYear: null, balances: [] };

  const balances = await listStudentFeeBalances(
    schoolId,
    studentId,
    activeYear.name,
  );

  return {
    student,
    activeYear: { id: activeYear.id, name: activeYear.name },
    balances,
  };
}
