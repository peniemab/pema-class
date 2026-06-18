import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { listFeesForAcademicYearLabel } from '@/lib/db/fees';
import {
  getStudentById,
  getStudentEnrollmentForYear,
} from '@/lib/db/students';
import { getActiveAcademicYearLite } from '@/lib/db/academic-years';
import {
  applyScolaritePoolToBalances,
  buildRawStudentFeeBalances,
  getPaymentLimitForFee,
} from '@/lib/school/scolarite-balances';
import type { ScolaritePoolSummary } from '@/lib/school/scolarite-balances';

export type StudentFeeBalance = {
  fee_id: string;
  fee_name: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  is_paid: boolean;
};

export type PaymentHistoryRow = {
  id: string;
  student_id: string;
  fee_id: string;
  fee_name: string;
  amount_paid: number;
  currency: string;
  receipt_number: string;
  created_at: string;
};

export async function getStudentFinanceForYear(
  schoolId: string,
  studentId: string,
  academicYearLabel: string,
): Promise<{
  balances: StudentFeeBalance[];
  payments: PaymentHistoryRow[];
  scolariteSummary: ScolaritePoolSummary | null;
}> {
  const fees = await listFeesForAcademicYearLabel(schoolId, academicYearLabel);
  if (fees.length === 0) {
    return { balances: [], payments: [], scolariteSummary: null };
  }

  const admin = createAdminClient();
  const feeIds = fees.map((f) => f.id);
  const feeById = new Map(fees.map((f) => [f.id, f]));

  const { data, error } = await admin
    .from('payments_history')
    .select(
      'id, student_id, fee_id, amount_paid, currency, receipt_number, created_at',
    )
    .eq('student_id', studentId)
    .in('fee_id', feeIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const paidByFee = new Map<string, number>();
  const payments: PaymentHistoryRow[] = [];

  for (const row of data ?? []) {
    const raw = row as {
      id: string;
      student_id: string;
      fee_id: string;
      amount_paid: number;
      currency: string;
      receipt_number: string;
      created_at: string;
    };
    const amount = Number(raw.amount_paid);
    paidByFee.set(raw.fee_id, (paidByFee.get(raw.fee_id) ?? 0) + amount);
    payments.push({
      id: raw.id,
      student_id: raw.student_id,
      fee_id: raw.fee_id,
      amount_paid: amount,
      currency: raw.currency,
      receipt_number: raw.receipt_number,
      created_at: raw.created_at,
      fee_name: feeById.get(raw.fee_id)?.name ?? '—',
    });
  }

  const rawBalances = buildRawStudentFeeBalances(fees, paidByFee);
  const { balances, scolariteSummary } = applyScolaritePoolToBalances(rawBalances);

  return { balances, payments, scolariteSummary };
}

export async function listStudentFeeBalances(
  schoolId: string,
  studentId: string,
  academicYearLabel: string,
): Promise<StudentFeeBalance[]> {
  const { balances } = await getStudentFinanceForYear(
    schoolId,
    studentId,
    academicYearLabel,
  );
  return balances;
}

export async function listStudentPayments(
  schoolId: string,
  studentId: string,
  academicYearLabel: string,
): Promise<PaymentHistoryRow[]> {
  const { payments } = await getStudentFinanceForYear(
    schoolId,
    studentId,
    academicYearLabel,
  );
  return payments;
}

export async function listPaymentsForYearFees(
  schoolId: string,
  academicYearLabel: string,
): Promise<PaymentHistoryRow[]> {
  const fees = await listFeesForAcademicYearLabel(schoolId, academicYearLabel);
  if (fees.length === 0) return [];

  const feeIds = fees.map((f) => f.id);
  const feeById = new Map(fees.map((f) => [f.id, f]));

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('payments_history')
    .select(
      'id, student_id, fee_id, amount_paid, currency, receipt_number, created_at',
    )
    .in('fee_id', feeIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const raw = row as {
      id: string;
      student_id: string;
      fee_id: string;
      amount_paid: number;
      currency: string;
      receipt_number: string;
      created_at: string;
    };
    return {
      id: raw.id,
      student_id: raw.student_id,
      fee_id: raw.fee_id,
      amount_paid: Number(raw.amount_paid),
      currency: raw.currency,
      receipt_number: raw.receipt_number,
      created_at: raw.created_at,
      fee_name: feeById.get(raw.fee_id)?.name ?? '—',
    };
  });
}

export async function recordPayment(input: {
  schoolId: string;
  studentId: string;
  feeId: string;
  userId: string;
  amount: number;
  /** Idempotence sync hors ligne (spec : fusion par receipt_number). */
  receiptNumber?: string;
}): Promise<{
  paymentId: string;
  receiptNumber: string;
  amountPaid: number;
  amountDue: number;
  totalPaidAfter: number;
  amountRemaining: number;
  currency: string;
  feeName: string;
}> {
  const student = await getStudentById(input.schoolId, input.studentId);
  if (!student) throw new Error('Élève introuvable.');

  const activeYear = await getActiveAcademicYearLite(input.schoolId);
  if (!activeYear) {
    throw new Error('Aucune année scolaire active.');
  }

  const enrollment = await getStudentEnrollmentForYear(
    input.schoolId,
    input.studentId,
    activeYear.id,
  );
  if (!enrollment) {
    throw new Error('Cet élève n’est pas inscrit pour l’année en cours.');
  }

  const admin = createAdminClient();
  const fees = await listFeesForAcademicYearLabel(input.schoolId, activeYear.name);
  const feeIds = fees.map((f) => f.id);

  const { data: paymentRows, error: payFetchError } = await admin
    .from('payments_history')
    .select('fee_id, amount_paid')
    .eq('student_id', input.studentId)
    .in('fee_id', feeIds);
  if (payFetchError) throw new Error(payFetchError.message);

  const paidByFee = new Map<string, number>();
  for (const row of paymentRows ?? []) {
    const raw = row as { fee_id: string; amount_paid: number };
    paidByFee.set(
      raw.fee_id,
      (paidByFee.get(raw.fee_id) ?? 0) + Number(raw.amount_paid),
    );
  }

  const rawBalances = buildRawStudentFeeBalances(fees, paidByFee);
  const paymentLimit = getPaymentLimitForFee(input.feeId, rawBalances);
  if (paymentLimit <= 0.001) {
    throw new Error('Ce frais est déjà entièrement payé.');
  }

  const { data: fee, error: feeError } = await admin
    .from('fees')
    .select('id, school_id, name, amount, currency, academic_year')
    .eq('id', input.feeId)
    .eq('school_id', input.schoolId)
    .maybeSingle();
  if (feeError) throw new Error(feeError.message);
  if (!fee) throw new Error('Frais introuvable.');
  if (fee.academic_year !== activeYear.name) {
    throw new Error('Ce frais n’appartient pas à l’année scolaire active.');
  }

  const balances = await listStudentFeeBalances(
    input.schoolId,
    input.studentId,
    activeYear.name,
  );
  const balance = balances.find((b) => b.fee_id === input.feeId);
  if (!balance) {
    const annualTarget = rawBalances.find((b) => b.fee_id === input.feeId);
    if (!annualTarget) throw new Error('Frais introuvable pour cet élève.');
  }

  const amountPaid = input.amount;
  if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
    throw new Error('Le montant doit être supérieur à zéro.');
  }
  if (amountPaid > paymentLimit + 0.001) {
    throw new Error(
      `Le montant ne peut pas dépasser le reste dû (${paymentLimit} ${fee.currency as string}).`,
    );
  }

  const receiptNumber = input.receiptNumber ?? `REC-${randomUUID()}`;
  const displayBalance = balance ?? {
    fee_id: input.feeId,
    fee_name: fee.name as string,
    amount_due: Number(fee.amount),
    amount_paid: paidByFee.get(input.feeId) ?? 0,
    amount_remaining: paymentLimit,
    currency: fee.currency as string,
    is_paid: false,
  };
  const totalPaidAfter = displayBalance.amount_paid + amountPaid;
  const amountDueForReceipt =
    balance?.amount_due ??
    (paymentLimit + (paidByFee.get(input.feeId) ?? 0));
  const amountRemaining = Math.max(0, amountDueForReceipt - totalPaidAfter);

  const { data: inserted, error: insertError } = await admin
    .from('payments_history')
    .insert({
      student_id: input.studentId,
      fee_id: input.feeId,
      amount_paid: amountPaid,
      currency: fee.currency as string,
      receipt_number: receiptNumber,
      created_by: input.userId,
    })
    .select('id')
    .single();
  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? 'Enregistrement du paiement impossible.');
  }

  return {
    paymentId: inserted.id as string,
    receiptNumber,
    amountPaid,
    amountDue: amountDueForReceipt,
    totalPaidAfter,
    amountRemaining,
    currency: fee.currency as string,
    feeName: fee.name as string,
  };
}
