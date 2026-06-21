import { getOfflineDb, type LocalAttendance } from '@/lib/offline/db';
import type { AttendanceStatus } from '@/lib/db/attendances';
import { replaceOrAddMutation } from '@/lib/offline/outbox-repo';
import type { OutboxMutation } from '@/lib/offline/outbox-types';
import { attendanceRowId } from '@/lib/offline/attendance-repo';

export type SaveAttendanceLocalResult =
  | { ok: true; saved: number; pendingSync: boolean }
  | { ok: false; error: string };

const VALID_STATUSES: AttendanceStatus[] = ['present', 'absent', 'late'];

/**
 * Enregistrement optimiste d'une feuille de présences (lot).
 * Écrit immédiatement dans Dexie + ticket outbox (coalescence par classe/date).
 */
export async function saveAttendanceBatchLocally(input: {
  schoolId: string;
  classId: string;
  date: string;
  entries: { studentId: string; status: AttendanceStatus }[];
}): Promise<SaveAttendanceLocalResult> {
  if (!input.classId?.trim()) {
    return { ok: false, error: 'Classe requise.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: 'Date invalide.' };
  }
  if (input.entries.length === 0) {
    return { ok: false, error: 'Aucun élève à enregistrer.' };
  }

  for (const entry of input.entries) {
    if (!VALID_STATUSES.includes(entry.status)) {
      return { ok: false, error: 'Statut invalide.' };
    }
  }

  const db = getOfflineDb();
  const now = new Date().toISOString();
  const mutationId = crypto.randomUUID();
  const entityId = `${input.classId}:${input.date}`;

  const rows: LocalAttendance[] = input.entries.map((e) => ({
    id: attendanceRowId(e.studentId, input.date),
    school_id: input.schoolId,
    student_id: e.studentId,
    class_id: input.classId,
    date: input.date,
    status: e.status,
    sync_status: 'pending',
    updated_at: now,
  }));

  const mutation: OutboxMutation = {
    id: mutationId,
    school_id: input.schoolId,
    entity_id: entityId,
    type: 'save_attendance_batch',
    payload: {
      classId: input.classId,
      date: input.date,
      entries: input.entries.map((e) => ({
        studentId: e.studentId,
        status: e.status,
      })),
    },
    created_at: now,
    attempts: 0,
    last_error: null,
    status: 'pending',
  };

  await db.transaction('rw', db.attendance, db.outbox, async () => {
    await db.attendance.bulkPut(rows);
    await replaceOrAddMutation(mutation);
  });

  return {
    ok: true,
    saved: input.entries.length,
    pendingSync: true,
  };
}
