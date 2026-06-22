import type { ClassRow } from '@/lib/db/classes';
import type { EnrolledStudent } from '@/lib/db/enrolled-students';
import type { AttendanceReportData } from '@/lib/db/attendance-reports';
import type {
  RepeatedAbsencesReportData,
  StudentAttendanceHistoryData,
  WeeklyAttendanceReportData,
} from '@/lib/db/attendance-reports-ext';
import type { AppDataValue } from '@/lib/offline/app-data-context';
import {
  computeAttendanceReport,
  computeRepeatedAbsencesReport,
  computeStudentAttendanceHistory,
  computeWeeklyAttendanceReport,
  parseAttendanceReportDate,
} from '@/lib/school/attendance-report-compute';
import { todayIsoDate } from '@/lib/date-utils';

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

function toClassRow(c: AppDataValue['classes'][number]): ClassRow {
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

function attendanceBundle(data: AppDataValue) {
  const activeYear =
    data.attendanceState?.activeYear ??
    data.studentsState?.activeYear ??
    data.caisseState?.activeYear ??
    null;
  if (!activeYear) return null;

  const classes = data.classes
    .filter((c) => c.academic_year_id === activeYear.id)
    .map(toClassRow);

  const enrolled = data.students
    .filter((s) => s.status === 'active')
    .map(toEnrolledStudent);

  const attendances = data.attendance.map((a) => ({
    student_id: a.student_id,
    class_id: a.class_id,
    date: a.date,
    status: a.status,
  }));

  return { activeYear, classes, enrolled, attendances };
}

export function buildAttendanceReportFromAppData(
  data: AppDataValue,
  params: { date?: string; classId?: string | null } = {},
): AttendanceReportData | null {
  const bundle = attendanceBundle(data);
  if (!bundle) return null;

  const { activeYear, classes, enrolled, attendances } = bundle;

  return computeAttendanceReport({
    activeYear,
    classes,
    enrolled,
    attendances,
    selectedDate: parseAttendanceReportDate(params.date),
    selectedClassId: params.classId,
  });
}

export function buildWeeklyAttendanceReportFromAppData(
  data: AppDataValue,
  params: { date?: string; classId?: string | null } = {},
): WeeklyAttendanceReportData | null {
  const bundle = attendanceBundle(data);
  if (!bundle) return null;

  const { activeYear, classes, enrolled, attendances } = bundle;

  return computeWeeklyAttendanceReport({
    activeYear,
    classes,
    enrolled,
    attendances,
    anchorDate: parseAttendanceReportDate(params.date ?? todayIsoDate()),
    selectedClassId: params.classId,
  });
}

export function buildRepeatedAbsencesReportFromAppData(
  data: AppDataValue,
  params: {
    periodDays?: number;
    minAbsences?: number;
    classId?: string | null;
  } = {},
): RepeatedAbsencesReportData | null {
  const bundle = attendanceBundle(data);
  if (!bundle) return null;

  const { activeYear, classes, enrolled, attendances } = bundle;
  const periodRaw = params.periodDays ?? 30;

  return computeRepeatedAbsencesReport({
    activeYear,
    classes,
    enrolled,
    attendances,
    periodDays: periodRaw === 7 ? 7 : 30,
    minAbsences: Math.max(1, params.minAbsences ?? 2),
    selectedClassId: params.classId,
  });
}

export function buildStudentAttendanceHistoryFromAppData(
  data: AppDataValue,
  params: { studentId?: string; startDate?: string; endDate?: string } = {},
): StudentAttendanceHistoryData | null {
  const bundle = attendanceBundle(data);
  if (!bundle) return null;

  const { activeYear, classes, enrolled, attendances } = bundle;

  return computeStudentAttendanceHistory({
    activeYear,
    classes,
    enrolled,
    attendances,
    studentId: params.studentId,
    startDate: params.startDate,
    endDate: params.endDate,
  });
}
