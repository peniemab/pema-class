'use server';

import { revalidatePath } from 'next/cache';
import { requireSchoolFinance, requireSchoolDirection } from '@/lib/auth/require-role';
import { getCaisseStudentPageData } from '@/lib/db/caisse-page';
import { getActiveAcademicYearLite } from '@/lib/db/academic-years';
import {
  listStudentFeeBalances,
  recordPayment,
} from '@/lib/db/payments';
import { getStudentById } from '@/lib/db/students';

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

export type CaisseStudentPageData = NonNullable<
  Awaited<ReturnType<typeof getCaisseStudentPageData>>
>;

function revalidateCaisse(studentId: string, caisseBasePath: string) {
  revalidatePath(caisseBasePath);
  revalidatePath(`${caisseBasePath}/${studentId}`);
  revalidatePath('/school/eleves');
  revalidatePath(`/school/eleves/${studentId}`);
  revalidatePath('/school/impayes');
  revalidatePath('/school');
  revalidatePath('/print/recu');
  revalidatePath('/print/inscription');
}

export async function loadCaisseStudentPage(
  studentId: string,
  caisseBasePath: '/school/caisse' | '/app/caisse',
) {
  const { schoolId } = await requireSchoolFinance();
  return getCaisseStudentPageData(schoolId, studentId, caisseBasePath);
}

export async function recordPaymentAction(input: {
  studentId: string;
  feeId: string;
  amount: number;
  caisseBasePath: '/school/caisse' | '/app/caisse';
}): Promise<ActionResult> {
  try {
    const { userId, schoolId } = await requireSchoolFinance();
    const result = await recordPayment({
      schoolId,
      studentId: input.studentId,
      feeId: input.feeId,
      userId,
      amount: input.amount,
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

  const activeYear = await getActiveAcademicYearLite(schoolId);
  if (!activeYear) return { student, activeYear: null, balances: [] };

  const balances = await listStudentFeeBalances(
    schoolId,
    studentId,
    activeYear.name,
  );

  return {
    student,
    activeYear,
    balances,
  };
}
