import { cache } from 'react';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import {
  listAttendancesForClassesInRange,
  listAttendancesForStudentInRange,
  type AttendanceStatus,
} from '@/lib/db/attendances';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import { listEnrolledStudentsForYear } from '@/lib/db/enrolled-students';

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shiftIsoDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function parseIsoDate(raw: string | undefined, fallback: string): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fallback;
  return raw;
}

/** Semaine calendaire lun → dim, plafonnée à aujourd'hui. */
export function getWeekRange(anchorDate: string): {
  start: string;
  end: string;
  dayCount: number;
} {
  const anchor = new Date(`${anchorDate}T12:00:00`);
  const day = anchor.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const start = monday.toISOString().slice(0, 10);
  const today = todayIsoDate();
  const end = sunday.toISOString().slice(0, 10) > today ? today : sunday.toISOString().slice(0, 10);

  const dayCount =
    Math.floor(
      (new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) /
        86400000,
    ) + 1;

  return { start, end, dayCount: Math.max(dayCount, 0) };
}

export function getPeriodRange(days: number, endDate?: string): {
  start: string;
  end: string;
  dayCount: number;
} {
  const end = parseIsoDate(endDate, todayIsoDate());
  const start = shiftIsoDate(end, -(days - 1));
  return { start, end, dayCount: days };
}

export type WeeklyClassSummary = {
  class_id: string;
  class_level: string;
  class_name: string;
  enrolled: number;
  totalSlots: number;
  present: number;
  absent: number;
  late: number;
  unmarked: number;
  attendanceRate: number;
};

export type WeeklyAttendanceReportData = {
  activeYear: { id: string; name: string };
  anchorDate: string;
  weekStart: string;
  weekEnd: string;
  dayCount: number;
  selectedClassId: string | null;
  classes: ClassRow[];
  totals: Omit<WeeklyClassSummary, 'class_id' | 'class_level' | 'class_name' | 'enrolled'> & {
    enrolled: number;
  };
  classSummaries: WeeklyClassSummary[];
};

export type RepeatedAbsenceRow = {
  student_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  class_id: string;
  class_name: string;
  class_level: string;
  absent_count: number;
  late_count: number;
  present_count: number;
  marked_days: number;
};

export type RepeatedAbsencesReportData = {
  activeYear: { id: string; name: string };
  periodDays: number;
  periodStart: string;
  periodEnd: string;
  selectedClassId: string | null;
  minAbsences: number;
  classes: ClassRow[];
  rows: RepeatedAbsenceRow[];
};

export type StudentAttendanceHistoryRecord = {
  date: string;
  status: AttendanceStatus;
  note: string | null;
};

export type StudentAttendanceHistoryData = {
  activeYear: { id: string; name: string } | null;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    matricule: string | null;
    class_id: string;
    class_name: string;
    class_level: string;
  } | null;
  startDate: string;
  endDate: string;
  dayCount: number;
  classes: ClassRow[];
  records: StudentAttendanceHistoryRecord[];
  summary: {
    present: number;
    absent: number;
    late: number;
    marked: number;
    unmarked: number;
  };
};

function countStatuses(records: { status: AttendanceStatus }[]) {
  let present = 0;
  let absent = 0;
  let late = 0;
  for (const record of records) {
    if (record.status === 'present') present += 1;
    else if (record.status === 'absent') absent += 1;
    else if (record.status === 'late') late += 1;
  }
  return { present, absent, late, marked: records.length };
}

async function fetchWeeklyAttendanceReport(
  schoolId: string,
  searchParams: Record<string, string | undefined>,
): Promise<WeeklyAttendanceReportData | null> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  const anchorDate = parseIsoDate(searchParams.date, todayIsoDate());
  const { start, end, dayCount } = getWeekRange(anchorDate);
  if (dayCount <= 0) return null;

  const classes = await listClassesForYear(schoolId, activeYear.id);
  const classParam = searchParams.classe?.trim();
  const selectedClassId =
    classParam && classes.some((c) => c.id === classParam) ? classParam : null;

  const enrolled = await listEnrolledStudentsForYear(schoolId, activeYear.id);
  const scopedClasses = selectedClassId
    ? classes.filter((c) => c.id === selectedClassId)
    : classes;
  const classIds = scopedClasses.map((c) => c.id);

  const attendances = await listAttendancesForClassesInRange(classIds, start, end);
  const byStudentDate = new Map<string, AttendanceStatus>();
  for (const att of attendances) {
    byStudentDate.set(`${att.student_id}:${att.date}`, att.status);
  }

  const classSummaries: WeeklyClassSummary[] = [];
  let totalEnrolled = 0;
  let totalSlots = 0;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;

  for (const cls of scopedClasses) {
    const classStudents = enrolled.filter((s) => s.class_id === cls.id);
    if (classStudents.length === 0) continue;

    let present = 0;
    let absent = 0;
    let late = 0;

    for (let i = 0; i < dayCount; i += 1) {
      const date = shiftIsoDate(start, i);
      for (const student of classStudents) {
        const status = byStudentDate.get(`${student.id}:${date}`);
        if (status === 'present') present += 1;
        else if (status === 'absent') absent += 1;
        else if (status === 'late') late += 1;
      }
    }

    const enrolledCount = classStudents.length;
    const slots = enrolledCount * dayCount;
    const unmarked = slots - present - absent - late;
    const attendanceRate = slots > 0 ? Math.round((present / slots) * 100) : 0;

    classSummaries.push({
      class_id: cls.id,
      class_level: cls.level,
      class_name: cls.name,
      enrolled: enrolledCount,
      totalSlots: slots,
      present,
      absent,
      late,
      unmarked,
      attendanceRate,
    });

    totalEnrolled += enrolledCount;
    totalSlots += slots;
    totalPresent += present;
    totalAbsent += absent;
    totalLate += late;
  }

  const totalUnmarked = totalSlots - totalPresent - totalAbsent - totalLate;

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    anchorDate,
    weekStart: start,
    weekEnd: end,
    dayCount,
    selectedClassId,
    classes,
    totals: {
      enrolled: totalEnrolled,
      totalSlots,
      present: totalPresent,
      absent: totalAbsent,
      late: totalLate,
      unmarked: totalUnmarked,
      attendanceRate:
        totalSlots > 0 ? Math.round((totalPresent / totalSlots) * 100) : 0,
    },
    classSummaries,
  };
}

async function fetchRepeatedAbsencesReport(
  schoolId: string,
  searchParams: Record<string, string | undefined>,
): Promise<RepeatedAbsencesReportData | null> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  const periodRaw = Number(searchParams.periode ?? '30');
  const periodDays = periodRaw === 7 ? 7 : 30;
  const minAbsences = Math.max(1, Number(searchParams.min ?? '2') || 2);
  const { start, end } = getPeriodRange(periodDays);

  const classes = await listClassesForYear(schoolId, activeYear.id);
  const classParam = searchParams.classe?.trim();
  const selectedClassId =
    classParam && classes.some((c) => c.id === classParam) ? classParam : null;

  const enrolled = await listEnrolledStudentsForYear(schoolId, activeYear.id);
  const scopedEnrolled = selectedClassId
    ? enrolled.filter((s) => s.class_id === selectedClassId)
    : enrolled;

  const classIds = selectedClassId
    ? [selectedClassId]
    : classes.map((c) => c.id);

  const attendances = await listAttendancesForClassesInRange(classIds, start, end);
  const byStudent = new Map<string, { present: number; absent: number; late: number }>();

  for (const att of attendances) {
    const bucket = byStudent.get(att.student_id) ?? { present: 0, absent: 0, late: 0 };
    if (att.status === 'present') bucket.present += 1;
    else if (att.status === 'absent') bucket.absent += 1;
    else if (att.status === 'late') bucket.late += 1;
    byStudent.set(att.student_id, bucket);
  }

  const rows: RepeatedAbsenceRow[] = [];
  for (const student of scopedEnrolled) {
    if (!student.class_id || !student.class_name || !student.class_level) continue;
    const counts = byStudent.get(student.id) ?? { present: 0, absent: 0, late: 0 };
    if (counts.absent < minAbsences) continue;

    rows.push({
      student_id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      matricule: student.matricule,
      class_id: student.class_id,
      class_name: student.class_name,
      class_level: student.class_level,
      absent_count: counts.absent,
      late_count: counts.late,
      present_count: counts.present,
      marked_days: counts.present + counts.absent + counts.late,
    });
  }

  rows.sort((a, b) => {
    if (b.absent_count !== a.absent_count) return b.absent_count - a.absent_count;
    return `${a.last_name} ${a.first_name}`.localeCompare(
      `${b.last_name} ${b.first_name}`,
      'fr',
    );
  });

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    periodDays,
    periodStart: start,
    periodEnd: end,
    selectedClassId,
    minAbsences,
    classes,
    rows,
  };
}

async function fetchStudentAttendanceHistory(
  schoolId: string,
  searchParams: Record<string, string | undefined>,
): Promise<StudentAttendanceHistoryData | null> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  const classes = await listClassesForYear(schoolId, activeYear.id);
  const studentId = searchParams.eleve?.trim() ?? '';
  const endDate = parseIsoDate(searchParams.fin, todayIsoDate());
  const startDate = parseIsoDate(
    searchParams.debut,
    shiftIsoDate(endDate, -29),
  );

  const enrolled = await listEnrolledStudentsForYear(schoolId, activeYear.id);
  const studentRow = studentId
    ? enrolled.find((s) => s.id === studentId)
    : undefined;

  if (!studentId) {
    return {
      activeYear: { id: activeYear.id, name: activeYear.name },
      student: null,
      startDate,
      endDate,
      dayCount:
        Math.floor(
          (new Date(`${endDate}T12:00:00`).getTime() -
            new Date(`${startDate}T12:00:00`).getTime()) /
            86400000,
        ) + 1,
      classes,
      records: [],
      summary: { present: 0, absent: 0, late: 0, marked: 0, unmarked: 0 },
    };
  }

  if (!studentRow?.class_id || !studentRow.class_name || !studentRow.class_level) {
    return {
      activeYear: { id: activeYear.id, name: activeYear.name },
      student: null,
      startDate,
      endDate,
      dayCount: 0,
      classes,
      records: [],
      summary: { present: 0, absent: 0, late: 0, marked: 0, unmarked: 0 },
    };
  }

  const attendances = await listAttendancesForStudentInRange(
    studentId,
    startDate,
    endDate,
  );

  const records: StudentAttendanceHistoryRecord[] = attendances.map((att) => ({
    date: att.date,
    status: att.status,
    note: att.note,
  }));

  const { present, absent, late, marked } = countStatuses(records);
  const dayCount =
    Math.floor(
      (new Date(`${endDate}T12:00:00`).getTime() -
        new Date(`${startDate}T12:00:00`).getTime()) /
        86400000,
    ) + 1;

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    student: {
      id: studentRow.id,
      first_name: studentRow.first_name,
      last_name: studentRow.last_name,
      matricule: studentRow.matricule,
      class_id: studentRow.class_id,
      class_name: studentRow.class_name,
      class_level: studentRow.class_level,
    },
    startDate,
    endDate,
    dayCount,
    classes,
    records,
    summary: {
      present,
      absent,
      late,
      marked,
      unmarked: Math.max(dayCount - marked, 0),
    },
  };
}

export const getWeeklyAttendanceReport = cache(fetchWeeklyAttendanceReport);
export const getRepeatedAbsencesReport = cache(fetchRepeatedAbsencesReport);
export const getStudentAttendanceHistory = cache(fetchStudentAttendanceHistory);
