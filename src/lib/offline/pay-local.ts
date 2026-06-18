import { getOfflineDb, type LocalPayment } from '@/lib/offline/db';
import { addOutboxMutation } from '@/lib/offline/outbox-repo';
import type { OutboxMutation, PayFeePayload } from '@/lib/offline/outbox-types';
import { readCaisseSyncState, readLocalFees } from '@/lib/offline/caisse-repo';
import {
  computeLocalStudentFinance,
  findLocalFeeCurrency,
  findLocalFeeName,
  getLocalPaymentLimit,
} from '@/lib/offline/finance-local';

export type PayLocalResult =
  | {
      ok: true;
      paymentId: string;
      receiptNumber: string;
      amountPaid: number;
      currency: string;
      feeName: string;
      amountRemaining: number;
      pendingSync: boolean;
    }
  | { ok: false; error: string };

/**
 * Encaissement optimiste local (spec : outbox pay_fee + receipt REC-…).
 * Si élève MAT-P-…, le paiement est mis en file jusqu'à sync inscription.
 */
export async function recordPaymentLocally(input: {
  schoolId: string;
  studentId: string;
  feeId: string;
  amount: number;
}): Promise<PayLocalResult> {
  const db = getOfflineDb();
  const student = await db.students.get(input.studentId);
  if (!student || student.school_id !== input.schoolId) {
    return { ok: false, error: 'Élève introuvable dans le cache local.' };
  }
  if (!student.class_id) {
    return {
      ok: false,
      error: 'Cet élève n’est pas inscrit pour l’année en cours.',
    };
  }

  const state = await readCaisseSyncState(input.schoolId);
  const activeYear = state?.activeYear;
  if (!activeYear) {
    return {
      ok: false,
      error: 'Aucune année scolaire active en cache.',
    };
  }

  const fees = await readLocalFees(input.schoolId, activeYear.name);
  if (fees.length === 0) {
    return {
      ok: false,
      error: 'Aucun frais en cache. Connectez-vous pour synchroniser.',
    };
  }

  const fee = fees.find((f) => f.id === input.feeId);
  if (!fee) {
    return { ok: false, error: 'Frais introuvable dans le cache local.' };
  }

  const existingPayments = await db.payments
    .where('school_id')
    .equals(input.schoolId)
    .filter((p) => p.student_id === input.studentId)
    .toArray();

  const limit = getLocalPaymentLimit(
    input.feeId,
    fees,
    existingPayments,
  );
  if (limit <= 0.001) {
    return { ok: false, error: 'Ce frais est déjà entièrement payé.' };
  }

  const amountPaid = input.amount;
  if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
    return { ok: false, error: 'Le montant doit être supérieur à zéro.' };
  }
  if (amountPaid > limit + 0.001) {
    return {
      ok: false,
      error: `Le montant ne peut pas dépasser le reste dû (${limit} ${fee.currency}).`,
    };
  }

  const mutationId = crypto.randomUUID();
  const receiptNumber = `REC-${mutationId}`;
  const now = new Date().toISOString();
  const feeName = findLocalFeeName(fees, input.feeId);
  const currency = findLocalFeeCurrency(fees, input.feeId);

  const payload: PayFeePayload = {
    studentId: input.studentId,
    studentMatricule: student.matricule,
    feeId: input.feeId,
    amount: amountPaid,
    currency,
    receiptNumber,
  };

  const mutation: OutboxMutation = {
    id: mutationId,
    school_id: input.schoolId,
    entity_id: input.studentId,
    type: 'pay_fee',
    payload,
    created_at: now,
    attempts: 0,
    last_error: null,
    status: 'pending',
  };

  const paymentRow: LocalPayment = {
    id: mutationId,
    school_id: input.schoolId,
    student_id: input.studentId,
    fee_id: input.feeId,
    fee_name: feeName,
    amount_paid: amountPaid,
    currency,
    receipt_number: receiptNumber,
    created_at: now,
    sync_status: 'pending',
  };

  await db.transaction('rw', db.outbox, db.payments, async () => {
    await addOutboxMutation(mutation);
    await db.payments.put(paymentRow);
  });

  const { balances } = computeLocalStudentFinance(fees, [
    ...existingPayments,
    paymentRow,
  ]);
  const balance = balances.find((b) => b.fee_id === input.feeId);
  const amountRemaining = balance?.amount_remaining ?? 0;

  return {
    ok: true,
    paymentId: mutationId,
    receiptNumber,
    amountPaid,
    currency,
    feeName,
    amountRemaining,
    pendingSync: true,
  };
}
