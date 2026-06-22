import type { CashJournalReportData, CashJournalRow } from '@/lib/db/finance-reports';
import { shiftIsoDate } from '@/lib/date-utils';
import type { FeeRow } from '@/lib/db/fees';
import type { EnrolledStudent } from '@/lib/db/enrolled-students';
import { getSchoolFeeCurrencies } from '@/lib/school/fee-currencies';

type PaymentInput = {
  id: string;
  student_id: string;
  fee_id: string;
  fee_name: string;
  amount_paid: number;
  currency: string;
  receipt_number: string;
  created_at: string;
};

/** Journal caisse à partir de paiements déjà en mémoire (0 requête). */
export function computeCashJournalReport(input: {
  activeYear: { id: string; name: string };
  selectedDate: string;
  fees: FeeRow[];
  enrolled: EnrolledStudent[];
  payments: PaymentInput[];
}): CashJournalReportData {
  const { activeYear, selectedDate, fees, enrolled, payments } = input;
  const studentById = new Map(enrolled.map((s) => [s.id, s]));
  const feeById = new Map(fees.map((f) => [f.id, f]));
  const feeIds = new Set(fees.map((f) => f.id));
  const nextDate = shiftIsoDate(selectedDate, 1);

  if (feeIds.size === 0) {
    return {
      activeYear,
      selectedDate,
      feeCurrencies: getSchoolFeeCurrencies(fees),
      totals: { count: 0, cdf: 0, usd: 0 },
      rows: [],
    };
  }

  const rows: CashJournalRow[] = [];
  let cdf = 0;
  let usd = 0;

  const dayPayments = payments
    .filter(
      (p) =>
        feeIds.has(p.fee_id) &&
        p.created_at >= `${selectedDate}T00:00:00.000Z` &&
        p.created_at < `${nextDate}T00:00:00.000Z`,
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  for (const row of dayPayments) {
    const student = studentById.get(row.student_id);
    if (!student) continue;

    const amount = Number(row.amount_paid);
    const currency = row.currency ?? 'CDF';
    if (currency === 'USD') usd += amount;
    else cdf += amount;

    rows.push({
      id: row.id,
      created_at: row.created_at,
      receipt_number: row.receipt_number,
      student_id: row.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      matricule: student.matricule,
      class_level: student.class_level,
      class_name: student.class_name,
      fee_name: feeById.get(row.fee_id)?.name ?? row.fee_name ?? '—',
      amount_paid: amount,
      currency,
    });
  }

  return {
    activeYear,
    selectedDate,
    feeCurrencies: getSchoolFeeCurrencies(fees),
    totals: { count: rows.length, cdf, usd },
    rows,
  };
}
