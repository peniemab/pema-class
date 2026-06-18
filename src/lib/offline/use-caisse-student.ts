'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { getOfflineDb, type LocalStudent } from '@/lib/offline/db';
import {
  readCaisseSyncState,
  readLocalFees,
  readLocalPaymentsForStudent,
} from '@/lib/offline/caisse-repo';
import { computeLocalStudentFinance } from '@/lib/offline/finance-local';
import type { PaymentHistoryRow, StudentFeeBalance } from '@/lib/db/payments';
import type { ScolaritePoolSummary } from '@/lib/school/scolarite-balances';

export type CaisseStudentLocal = {
  student: LocalStudent | undefined;
  activeYear: { id: string; name: string } | null;
  balances: StudentFeeBalance[];
  payments: PaymentHistoryRow[];
  scolariteSummary: ScolaritePoolSummary | null;
  pendingPaymentIds: Set<string>;
  loading: boolean;
};

export function useCaisseStudent(
  schoolId: string,
  studentId: string,
): CaisseStudentLocal {
  const student = useLiveQuery(
    () => getOfflineDb().students.get(studentId),
    [studentId],
  );

  const state = useLiveQuery(
    () => readCaisseSyncState(schoolId),
    [schoolId],
  );

  const fees = useLiveQuery(
    async () => {
      const year = (await readCaisseSyncState(schoolId))?.activeYear;
      if (!year) return [];
      return readLocalFees(schoolId, year.name);
    },
    [schoolId],
  );

  const payments = useLiveQuery(
    () => readLocalPaymentsForStudent(schoolId, studentId),
    [schoolId, studentId],
  );

  const finance = useLiveQuery(
    async () => {
      const year = (await readCaisseSyncState(schoolId))?.activeYear;
      if (!year || fees === undefined || payments === undefined) {
        return null;
      }
      const yearFees = await readLocalFees(schoolId, year.name);
      const studentPayments = await readLocalPaymentsForStudent(
        schoolId,
        studentId,
      );
      return computeLocalStudentFinance(yearFees, studentPayments);
    },
    [schoolId, studentId, fees, payments],
  );

  const pendingPaymentIds = new Set(
    (payments ?? [])
      .filter((p) => p.sync_status === 'pending')
      .map((p) => p.id),
  );

  return {
    student,
    activeYear: state?.activeYear ?? null,
    balances: finance?.balances ?? [],
    payments: finance?.payments ?? [],
    scolariteSummary: finance?.scolariteSummary ?? null,
    pendingPaymentIds,
    loading:
      student === undefined ||
      fees === undefined ||
      payments === undefined ||
      finance === undefined,
  };
}
