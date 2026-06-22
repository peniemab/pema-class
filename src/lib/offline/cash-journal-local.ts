import type { CashJournalReportData } from '@/lib/db/finance-reports';
import type { EnrolledStudent } from '@/lib/db/enrolled-students';
import type { FeeRow } from '@/lib/db/fees';
import type { AppDataValue } from '@/lib/offline/app-data-context';
import { computeCashJournalReport } from '@/lib/school/cash-journal-compute';

function toEnrolledStudent(s: AppDataValue['students'][number]): EnrolledStudent {
  return {
    id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    matricule: s.matricule,
    class_id: s.class_id,
    class_name: s.class_name,
    class_level: s.class_level,
  };
}

function toFeeRow(f: AppDataValue['fees'][number]): FeeRow {
  return {
    id: f.id,
    school_id: f.school_id,
    name: f.name,
    amount: f.amount,
    currency: f.currency,
    academic_year: f.academic_year,
    created_at: '',
  };
}

/** Journal caisse du jour depuis AppData (affichage instantané). */
export function buildCashJournalFromAppData(
  data: AppDataValue,
  selectedDate: string,
): CashJournalReportData | null {
  const activeYear =
    data.caisseState?.activeYear ?? data.studentsState?.activeYear ?? null;

  if (!activeYear) return null;
  if (data.payments.length === 0 && data.fees.length === 0) return null;

  const enrolled = data.students
    .filter((s) => s.status === 'active')
    .map(toEnrolledStudent);

  const fees = data.fees
    .filter((f) => f.academic_year === activeYear.name)
    .map(toFeeRow);

  return computeCashJournalReport({
    activeYear,
    selectedDate,
    fees,
    enrolled,
    payments: data.payments.map((p) => ({
      id: p.id,
      student_id: p.student_id,
      fee_id: p.fee_id,
      fee_name: p.fee_name,
      amount_paid: p.amount_paid,
      currency: p.currency,
      receipt_number: p.receipt_number,
      created_at: p.created_at,
    })),
  });
}
