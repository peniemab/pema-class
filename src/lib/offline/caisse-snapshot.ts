import { getActiveAcademicYear } from '@/lib/db/academic-years';
import type { FeeRow } from '@/lib/db/fees';
import { listFeesForAcademicYearLabel } from '@/lib/db/fees';
import {
  listPaymentsForYearFees,
  type PaymentHistoryRow,
} from '@/lib/db/payments';
import {
  listStudentsDirectory,
  type StudentDirectoryRow,
} from '@/lib/db/students';

/** Instantané caisse : frais, paiements et annuaire pour l'année active. */
export type CaisseSnapshot = {
  schoolId: string;
  activeYear: { id: string; name: string } | null;
  fees: FeeRow[];
  payments: PaymentHistoryRow[];
  students: StudentDirectoryRow[];
  generatedAt: string;
};

export async function getCaisseSnapshot(schoolId: string): Promise<CaisseSnapshot> {
  const activeYear = await getActiveAcademicYear(schoolId);
  const generatedAt = new Date().toISOString();

  if (!activeYear) {
    return {
      schoolId,
      activeYear: null,
      fees: [],
      payments: [],
      students: [],
      generatedAt,
    };
  }

  const [fees, directory, payments] = await Promise.all([
    listFeesForAcademicYearLabel(schoolId, activeYear.name),
    listStudentsDirectory(schoolId, activeYear.id, {}, 1, 100_000),
    listPaymentsForYearFees(schoolId, activeYear.name),
  ]);

  return {
    schoolId,
    activeYear: { id: activeYear.id, name: activeYear.name },
    fees,
    payments,
    students: directory.rows,
    generatedAt,
  };
}
