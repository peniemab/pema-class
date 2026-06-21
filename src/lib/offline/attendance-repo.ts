import {
  getOfflineDb,
  metaKey,
  type LocalAttendance,
  type LocalClass,
  type LocalStudent,
} from '@/lib/offline/db';
import type { AttendancePageData } from '@/lib/db/attendance-page';
import type { ClassRow } from '@/lib/db/classes';
import type { AttendanceStatus } from '@/lib/db/attendances';
import {
  canMarkAllClassAttendances,
  normalizeStaffRole,
  type StaffRole,
} from '@/lib/auth/types';
import type { AttendanceSnapshot } from '@/lib/offline/attendance-snapshot';

export type AttendanceSyncState = {
  activeYear: { id: string; name: string } | null;
  teacherClassIds: string[];
  teacherLimited: boolean;
  lastSyncAt: string | null;
};

const SCOPE_STATE = 'attendance:state';

export function attendanceRowId(studentId: string, date: string): string {
  return `${studentId}:${date}`;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return todayIsoDate();
  return raw;
}

function toClassRow(c: LocalClass): ClassRow {
  return {
    id: c.id,
    school_id: c.school_id,
    academic_year_id: c.academic_year_id,
    name: c.name,
    level: c.level,
    cycle: c.cycle,
    max_capacity: c.max_capacity,
    current_count: c.current_count,
    created_at: '',
  };
}

/** Écrit le snapshot présences dans IndexedDB (fusion avec pending local). */
export async function saveAttendanceSnapshot(
  snapshot: AttendanceSnapshot,
): Promise<void> {
  const db = getOfflineDb();
  const { schoolId } = snapshot;

  const incoming: LocalAttendance[] = snapshot.attendances.map((a) => ({
    id: attendanceRowId(a.student_id, a.date),
    school_id: schoolId,
    student_id: a.student_id,
    class_id: a.class_id,
    date: a.date,
    status: a.status,
    sync_status: 'synced',
    updated_at: snapshot.generatedAt,
  }));

  await db.transaction('rw', db.attendance, db.meta, async () => {
    const pendingKeys = new Set(
      (
        await db.attendance
          .where('school_id')
          .equals(schoolId)
          .filter((r) => r.sync_status === 'pending')
          .primaryKeys()
      ).map(String),
    );

    for (const row of incoming) {
      if (pendingKeys.has(row.id)) continue;
      await db.attendance.put(row);
    }

    await db.meta.put({
      key: metaKey(schoolId, SCOPE_STATE),
      school_id: schoolId,
      scope: SCOPE_STATE,
      value: {
        activeYear: snapshot.activeYear,
        teacherClassIds: snapshot.teacherClassIds,
        teacherLimited: snapshot.teacherLimited,
        lastSyncAt: snapshot.generatedAt,
      } satisfies AttendanceSyncState,
      updated_at: snapshot.generatedAt,
    });
  });
}

export async function readAttendanceSyncState(
  schoolId: string,
): Promise<AttendanceSyncState | null> {
  const row = await getOfflineDb().meta.get(metaKey(schoolId, SCOPE_STATE));
  return (row?.value as AttendanceSyncState | undefined) ?? null;
}

export async function readLocalAttendancesForDate(
  schoolId: string,
  date: string,
): Promise<LocalAttendance[]> {
  return getOfflineDb()
    .attendance.where('school_id')
    .equals(schoolId)
    .filter((r) => r.date === date)
    .toArray();
}

function filterClassesForRole(
  classes: LocalClass[],
  role: StaffRole,
  teacherClassIds: string[],
): { classes: ClassRow[]; teacherLimited: boolean } {
  const normalized = normalizeStaffRole(role);
  if (canMarkAllClassAttendances(normalized)) {
    return {
      classes: classes.map(toClassRow),
      teacherLimited: false,
    };
  }
  if (normalized !== 'enseignant') {
    return { classes: [], teacherLimited: false };
  }
  const allowed = new Set(teacherClassIds);
  return {
    classes: classes.filter((c) => allowed.has(c.id)).map(toClassRow),
    teacherLimited: true,
  };
}

/** Construit les données de la page présences depuis Dexie (0 ms). */
export function buildLocalAttendancePageData(input: {
  schoolId: string;
  role: StaffRole;
  syncState: AttendanceSyncState | null;
  classes: LocalClass[];
  students: LocalStudent[];
  attendances: LocalAttendance[];
  selectedClassId: string | null;
  selectedDate: string;
}): AttendancePageData | null {
  const activeYear = input.syncState?.activeYear;
  if (!activeYear) return null;

  const selectedDate = parseDate(input.selectedDate);
  const teacherClassIds = input.syncState?.teacherClassIds ?? [];
  const { classes, teacherLimited } = filterClassesForRole(
    input.classes.filter((c) => c.academic_year_id === activeYear.id),
    input.role,
    teacherClassIds,
  );

  if (classes.length === 0) {
    return {
      activeYear,
      classes: [],
      selectedClassId: null,
      selectedDate,
      rows: [],
      stats: { total: 0, marked: 0, present: 0, absent: 0, late: 0 },
      teacherLimited,
    };
  }

  const classParam = input.selectedClassId?.trim();
  const resolvedClassId =
    classParam && classes.some((c) => c.id === classParam)
      ? classParam
      : classes[0]?.id ?? null;

  if (!resolvedClassId) {
    return {
      activeYear,
      classes,
      selectedClassId: null,
      selectedDate,
      rows: [],
      stats: { total: 0, marked: 0, present: 0, absent: 0, late: 0 },
      teacherLimited,
    };
  }

  const classStudents = input.students.filter(
    (s) =>
      s.school_id === input.schoolId &&
      s.status === 'active' &&
      s.class_id === resolvedClassId,
  );

  const attendanceByStudent = new Map<string, AttendanceStatus>();
  for (const att of input.attendances) {
    if (att.date === selectedDate) {
      attendanceByStudent.set(att.student_id, att.status);
    }
  }

  const rows = classStudents.map((s) => ({
    student_id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    matricule: s.matricule,
    status: attendanceByStudent.get(s.id) ?? null,
  }));

  let present = 0;
  let absent = 0;
  let late = 0;
  let marked = 0;
  for (const row of rows) {
    if (!row.status) continue;
    marked += 1;
    if (row.status === 'present') present += 1;
    else if (row.status === 'absent') absent += 1;
    else if (row.status === 'late') late += 1;
  }

  return {
    activeYear,
    classes,
    selectedClassId: resolvedClassId,
    selectedDate,
    rows,
    stats: {
      total: rows.length,
      marked,
      present,
      absent,
      late,
    },
    teacherLimited,
  };
}
