import { createAdminClient } from '@/lib/supabase/admin';

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late'] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AttendanceRow = {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
  recorded_by: string | null;
};

export type AttendanceUpsertInput = {
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  recordedBy: string;
};

export async function listAttendancesForStudentsOnDate(
  studentIds: string[],
  date: string,
): Promise<Map<string, AttendanceRow>> {
  if (studentIds.length === 0) return new Map();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('student_attendances')
    .select('id, student_id, class_id, date, status, note, recorded_by')
    .eq('date', date)
    .in('student_id', studentIds);

  if (error) throw new Error(error.message);

  const map = new Map<string, AttendanceRow>();
  for (const row of data ?? []) {
    const r = row as AttendanceRow;
    map.set(r.student_id, r);
  }
  return map;
}

/** Upsert en lot — une requête pour toute la classe. */
export async function upsertAttendancesBatch(
  rows: AttendanceUpsertInput[],
): Promise<void> {
  if (rows.length === 0) return;

  const admin = createAdminClient();
  const payload = rows.map((r) => ({
    student_id: r.studentId,
    class_id: r.classId,
    date: r.date,
    status: r.status,
    recorded_by: r.recordedBy,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await admin
    .from('student_attendances')
    .upsert(payload, { onConflict: 'student_id,date' });

  if (error) throw new Error(error.message);
}

export async function listAttendancesForClassesInRange(
  classIds: string[],
  startDate: string,
  endDate: string,
): Promise<AttendanceRow[]> {
  if (classIds.length === 0) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('student_attendances')
    .select('id, student_id, class_id, date, status, note, recorded_by')
    .in('class_id', classIds)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw new Error(error.message);
  return (data ?? []) as AttendanceRow[];
}

export async function listAttendancesForStudentInRange(
  studentId: string,
  startDate: string,
  endDate: string,
): Promise<AttendanceRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('student_attendances')
    .select('id, student_id, class_id, date, status, note, recorded_by')
    .eq('student_id', studentId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as AttendanceRow[];
}
