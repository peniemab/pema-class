import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { listFeesForAcademicYearLabel } from '@/lib/db/fees';
import {
  getStudentById,
  getStudentEnrollmentForYear,
} from '@/lib/db/students';
import { getActiveAcademicYear } from '@/lib/db/academic-years';

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

export async function listStudentFeeBalances(
  schoolId: string,
  studentId: string,
  academicYearLabel: string,
): Promise<StudentFeeBalance[]> {
  const fees = await listFeesForAcademicYearLabel(schoolId, academicYearLabel);
  if (fees.length === 0) return [];

  const admin = createAdminClient();
  const feeIds = fees.map((f) => f.id);

  const { data: payments, error } = await admin
    .from('payments_history')
    .select('fee_id, amount_paid')
    .eq('student_id', studentId)
    .in('fee_id', feeIds);
  if (error) throw new Error(error.message);

  const paidByFee = new Map<string, number>();
  for (const row of payments ?? []) {
    const feeId = (row as { fee_id: string }).fee_id;
    const amount = Number((row as { amount_paid: number }).amount_paid);
    paidByFee.set(feeId, (paidByFee.get(feeId) ?? 0) + amount);
  }

  return fees.map((fee) => {
    const amountPaid = paidByFee.get(fee.id) ?? 0;
    const amountDue = Number(fee.amount);
    const amountRemaining = Math.max(0, amountDue - amountPaid);
    return {
      fee_id: fee.id,
      fee_name: fee.name,
      amount_due: amountDue,
      amount_paid: amountPaid,
      amount_remaining: amountRemaining,
      currency: fee.currency,
      is_paid: amountRemaining <= 0,
    };
  });
}

export async function listStudentPayments(
  schoolId: string,
  studentId: string,
  academicYearLabel: string,
): Promise<PaymentHistoryRow[]> {
  const fees = await listFeesForAcademicYearLabel(schoolId, academicYearLabel);
  if (fees.length === 0) return [];

  const feeById = new Map(fees.map((f) => [f.id, f]));
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('payments_history')
    .select('id, student_id, fee_id, amount_paid, currency, receipt_number, created_at')
    .eq('student_id', studentId)
    .in(
      'fee_id',
      fees.map((f) => f.id),
    )
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return ((data ?? []) as Omit<PaymentHistoryRow, 'fee_name'>[]).map((row) => ({
    ...row,
    fee_name: feeById.get(row.fee_id)?.name ?? '—',
  }));
}

export async function recordPayment(input: {
  schoolId: string;
  studentId: string;
  feeId: string;
  userId: string;
}): Promise<{
  paymentId: string;
  receiptNumber: string;
  amountPaid: number;
  currency: string;
  feeName: string;
}> {
  const student = await getStudentById(input.schoolId, input.studentId);
  if (!student) throw new Error('Élève introuvable.');

  const activeYear = await getActiveAcademicYear(input.schoolId);
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
  if (!balance) throw new Error('Frais introuvable pour cet élève.');
  if (balance.amount_remaining <= 0) {
    throw new Error('Ce frais est déjà entièrement payé.');
  }

  const amountPaid = balance.amount_remaining;
  const receiptNumber = `REC-${randomUUID()}`;

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
    currency: fee.currency as string,
    feeName: fee.name as string,
  };
}
