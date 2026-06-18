import {
  getOfflineDb,
  metaKey,
  type LocalFee,
  type LocalPayment,
  type LocalStudent,
} from '@/lib/offline/db';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';

export type CaisseSyncState = {
  activeYear: { id: string; name: string } | null;
  lastSyncAt: string | null;
};

const SCOPE_STATE = 'caisse:state';

/** Écrit le snapshot caisse dans IndexedDB (fusion par receipt_number). */
export async function saveCaisseSnapshot(snapshot: CaisseSnapshot): Promise<void> {
  const db = getOfflineDb();
  const { schoolId } = snapshot;

  const fees: LocalFee[] = snapshot.fees.map((f) => ({
    id: f.id,
    school_id: f.school_id,
    name: f.name,
    amount: Number(f.amount),
    currency: f.currency,
    academic_year: f.academic_year,
  }));

  const serverReceipts = new Set(
    snapshot.payments.map((p) => p.receipt_number),
  );

  const payments: LocalPayment[] = snapshot.payments.map((p) => ({
    id: p.id,
    school_id: schoolId,
    student_id: p.student_id,
    fee_id: p.fee_id,
    fee_name: p.fee_name,
    amount_paid: Number(p.amount_paid),
    currency: p.currency,
    receipt_number: p.receipt_number,
    created_at: p.created_at,
    sync_status: 'synced',
  }));

  const students: LocalStudent[] = snapshot.students.map((s) => ({
    id: s.id,
    school_id: schoolId,
    first_name: s.first_name,
    last_name: s.last_name,
    matricule: s.matricule,
    gender: s.gender,
    birth_date: s.birth_date,
    status: s.status,
    class_id: s.class_id,
    class_name: s.class_name,
    class_level: s.class_level,
    class_cycle: s.class_cycle,
    sync_status: 'synced',
    updated_at: snapshot.generatedAt,
  }));

  await db.transaction(
    'rw',
    db.fees,
    db.payments,
    db.students,
    db.meta,
    async () => {
      const staleFees = await db.fees
        .where('school_id')
        .equals(schoolId)
        .primaryKeys();
      await db.fees.bulkDelete(staleFees);
      await db.fees.bulkPut(fees);

      const staleSyncedPayments = await db.payments
        .where('school_id')
        .equals(schoolId)
        .filter((p) => p.sync_status === 'synced')
        .primaryKeys();
      await db.payments.bulkDelete(staleSyncedPayments);

      const pendingLocal = await db.payments
        .where('school_id')
        .equals(schoolId)
        .filter(
          (p) =>
            p.sync_status === 'pending' &&
            !serverReceipts.has(p.receipt_number),
        )
        .toArray();
      await db.payments.bulkPut([...payments, ...pendingLocal]);

      const staleSyncedStudents = await db.students
        .where('school_id')
        .equals(schoolId)
        .filter((s) => s.sync_status === 'synced')
        .primaryKeys();
      await db.students.bulkDelete(staleSyncedStudents);
      await db.students.bulkPut(students);

      const state: CaisseSyncState = {
        activeYear: snapshot.activeYear,
        lastSyncAt: snapshot.generatedAt,
      };
      await db.meta.put({
        key: metaKey(schoolId, SCOPE_STATE),
        school_id: schoolId,
        scope: SCOPE_STATE,
        value: state,
        updated_at: snapshot.generatedAt,
      });
    },
  );
}

export async function readCaisseSyncState(
  schoolId: string,
): Promise<CaisseSyncState | null> {
  const row = await getOfflineDb().meta.get(metaKey(schoolId, SCOPE_STATE));
  return (row?.value as CaisseSyncState | undefined) ?? null;
}

export async function readLocalFees(
  schoolId: string,
  academicYearLabel: string,
): Promise<LocalFee[]> {
  return getOfflineDb()
    .fees.where('school_id')
    .equals(schoolId)
    .filter((f) => f.academic_year === academicYearLabel)
    .toArray();
}

export async function readLocalPaymentsForStudent(
  schoolId: string,
  studentId: string,
): Promise<LocalPayment[]> {
  return getOfflineDb()
    .payments.where('school_id')
    .equals(schoolId)
    .filter((p) => p.student_id === studentId)
    .toArray();
}
