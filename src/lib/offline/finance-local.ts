import type { PaymentHistoryRow, StudentFeeBalance } from '@/lib/db/payments';
import type { LocalFee, LocalPayment } from '@/lib/offline/db';
import type { ScolaritePoolSummary } from '@/lib/school/scolarite-balances';
import {
  applyScolaritePoolToBalances,
  buildRawStudentFeeBalances,
  getPaymentLimitForFee,
} from '@/lib/school/scolarite-balances';

export type LocalStudentFinance = {
  balances: StudentFeeBalance[];
  payments: PaymentHistoryRow[];
  scolariteSummary: ScolaritePoolSummary | null;
};

/** Calcule soldes et historique à partir du cache IndexedDB. */
export function computeLocalStudentFinance(
  fees: LocalFee[],
  payments: LocalPayment[],
): LocalStudentFinance {
  if (fees.length === 0) {
    return { balances: [], payments: [], scolariteSummary: null };
  }

  const feeIds = new Set(fees.map((f) => f.id));
  const studentPayments = payments.filter((p) => feeIds.has(p.fee_id));

  const paidByFee = new Map<string, number>();
  const history: PaymentHistoryRow[] = [];

  for (const p of studentPayments) {
    const amount = Number(p.amount_paid);
    paidByFee.set(p.fee_id, (paidByFee.get(p.fee_id) ?? 0) + amount);
    history.push({
      id: p.id,
      student_id: p.student_id,
      fee_id: p.fee_id,
      fee_name: p.fee_name,
      amount_paid: amount,
      currency: p.currency,
      receipt_number: p.receipt_number,
      created_at: p.created_at,
    });
  }

  history.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const rawBalances = buildRawStudentFeeBalances(fees, paidByFee);
  const { balances, scolariteSummary } =
    applyScolaritePoolToBalances(rawBalances);

  return { balances, payments: history, scolariteSummary };
}

/** Montant max encaissable sur un poste (cache local). */
export function getLocalPaymentLimit(
  feeId: string,
  fees: LocalFee[],
  payments: LocalPayment[],
): number {
  const paidByFee = new Map<string, number>();
  const feeIds = new Set(fees.map((f) => f.id));
  for (const p of payments) {
    if (!feeIds.has(p.fee_id)) continue;
    paidByFee.set(
      p.fee_id,
      (paidByFee.get(p.fee_id) ?? 0) + Number(p.amount_paid),
    );
  }
  const rawBalances = buildRawStudentFeeBalances(fees, paidByFee);
  return getPaymentLimitForFee(feeId, rawBalances);
}

export function findLocalFeeName(
  fees: LocalFee[],
  feeId: string,
): string {
  return feeByIdSafe(fees, feeId)?.name ?? '—';
}

function feeByIdSafe(fees: LocalFee[], feeId: string): LocalFee | undefined {
  return fees.find((f) => f.id === feeId);
}

export function findLocalFeeCurrency(
  fees: LocalFee[],
  feeId: string,
): string {
  return feeByIdSafe(fees, feeId)?.currency ?? 'CDF';
}
