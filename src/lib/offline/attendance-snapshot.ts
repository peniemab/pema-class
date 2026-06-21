import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listAttendancesForClassesInRange } from '@/lib/db/attendances';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import { listTeacherClassIds } from '@/lib/db/teacher-classes';
import {
  canMarkAllClassAttendances,
  normalizeStaffRole,
  type StaffRole,
} from '@/lib/auth/types';
import type { AttendanceStatus } from '@/lib/db/attendances';

const HISTORY_DAYS = 90;

export type AttendanceSnapshotRow = {
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
};

/** Instantané présences pour le cache hors ligne (90 derniers jours). */
export type AttendanceSnapshot = {
  schoolId: string;
  staffId: string;
  teacherClassIds: string[];
  teacherLimited: boolean;
  activeYear: { id: string; name: string } | null;
  attendances: AttendanceSnapshotRow[];
  generatedAt: string;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function subtractDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function resolveStaffClasses(
  schoolId: string,
  academicYearId: string,
  staffId: string,
  role: StaffRole,
): Promise<{ classes: ClassRow[]; teacherClassIds: string[]; teacherLimited: boolean }> {
  const all = await listClassesForYear(schoolId, academicYearId);
  const normalized = normalizeStaffRole(role);

  if (canMarkAllClassAttendances(normalized)) {
    return {
      classes: all,
      teacherClassIds: all.map((c) => c.id),
      teacherLimited: false,
    };
  }

  if (normalized !== 'enseignant') {
    return { classes: [], teacherClassIds: [], teacherLimited: false };
  }

  const teacherClassIds = await listTeacherClassIds(
    schoolId,
    academicYearId,
    staffId,
  );
  const allowed = new Set(teacherClassIds);
  return {
    classes: all.filter((c) => allowed.has(c.id)),
    teacherClassIds,
    teacherLimited: true,
  };
}

export async function getAttendanceSnapshot(
  schoolId: string,
  staffId: string,
  role: StaffRole,
): Promise<AttendanceSnapshot> {
  const generatedAt = new Date().toISOString();
  const activeYear = await getActiveAcademicYear(schoolId);

  if (!activeYear) {
    return {
      schoolId,
      staffId,
      teacherClassIds: [],
      teacherLimited: false,
      activeYear: null,
      attendances: [],
      generatedAt,
    };
  }

  const { classes, teacherClassIds, teacherLimited } = await resolveStaffClasses(
    schoolId,
    activeYear.id,
    staffId,
    role,
  );

  const classIds = classes.map((c) => c.id);
  const endDate = todayIsoDate();
  const startDate = subtractDays(endDate, HISTORY_DAYS);

  const rows =
    classIds.length > 0
      ? await listAttendancesForClassesInRange(classIds, startDate, endDate)
      : [];

  return {
    schoolId,
    staffId,
    teacherClassIds,
    teacherLimited,
    activeYear: { id: activeYear.id, name: activeYear.name },
    attendances: rows.map((r) => ({
      student_id: r.student_id,
      class_id: r.class_id,
      date: r.date,
      status: r.status,
    })),
    generatedAt,
  };
}
