import { cache } from 'react';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listAttendancesForStudentsOnDate, type AttendanceStatus } from '@/lib/db/attendances';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import { listEnrolledStudentsForYear } from '@/lib/db/enrolled-students';
import {
  SCHOOL_DIRECTION_ROLES,
  normalizeStaffRole,
  type StaffRole,
} from '@/lib/auth/types';
import { createAdminClient } from '@/lib/supabase/admin';

export type PresenceStudentRow = {
  student_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  status: AttendanceStatus | null;
};

export type AttendancePageData = {
  activeYear: { id: string; name: string };
  classes: ClassRow[];
  selectedClassId: string | null;
  selectedDate: string;
  rows: PresenceStudentRow[];
  stats: {
    total: number;
    marked: number;
    present: number;
    absent: number;
    late: number;
  };
  teacherLimited: boolean;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return todayIsoDate();
  return raw;
}

async function listClassesForStaff(
  schoolId: string,
  academicYearId: string,
  staffId: string,
  role: StaffRole,
): Promise<{ classes: ClassRow[]; teacherLimited: boolean }> {
  const all = await listClassesForYear(schoolId, academicYearId);
  const normalized = normalizeStaffRole(role);

  if (SCHOOL_DIRECTION_ROLES.includes(normalized) || normalized === 'secretaire') {
    return { classes: all, teacherLimited: false };
  }

  if (normalized !== 'enseignant') {
    return { classes: [], teacherLimited: false };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('teacher_classes')
    .select('class_id')
    .eq('staff_id', staffId)
    .eq('academic_year_id', academicYearId);

  if (error) throw new Error(error.message);

  const allowed = new Set((data ?? []).map((r) => (r as { class_id: string }).class_id));
  return {
    classes: all.filter((c) => allowed.has(c.id)),
    teacherLimited: true,
  };
}

async function fetchAttendancePageData(
  schoolId: string,
  staffId: string,
  role: StaffRole,
  searchParams: Record<string, string | undefined>,
): Promise<AttendancePageData | null> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  const selectedDate = parseDate(searchParams.date);
  const { classes, teacherLimited } = await listClassesForStaff(
    schoolId,
    activeYear.id,
    staffId,
    role,
  );

  if (classes.length === 0) {
    return {
      activeYear: { id: activeYear.id, name: activeYear.name },
      classes: [],
      selectedClassId: null,
      selectedDate,
      rows: [],
      stats: { total: 0, marked: 0, present: 0, absent: 0, late: 0 },
      teacherLimited,
    };
  }

  const classParam = searchParams.classe?.trim();
  const selectedClassId =
    classParam && classes.some((c) => c.id === classParam)
      ? classParam
      : classes[0]?.id ?? null;

  if (!selectedClassId) {
    return {
      activeYear: { id: activeYear.id, name: activeYear.name },
      classes,
      selectedClassId: null,
      selectedDate,
      rows: [],
      stats: { total: 0, marked: 0, present: 0, absent: 0, late: 0 },
      teacherLimited,
    };
  }

  const enrolled = await listEnrolledStudentsForYear(schoolId, activeYear.id);
  const classStudents = enrolled.filter((s) => s.class_id === selectedClassId);
  const studentIds = classStudents.map((s) => s.id);

  const attendanceByStudent = await listAttendancesForStudentsOnDate(
    studentIds,
    selectedDate,
  );

  const rows: PresenceStudentRow[] = classStudents.map((s) => {
    const att = attendanceByStudent.get(s.id);
    return {
      student_id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      matricule: s.matricule,
      status: att?.status ?? null,
    };
  });

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
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes,
    selectedClassId,
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

export const getAttendancePageData = cache(fetchAttendancePageData);
