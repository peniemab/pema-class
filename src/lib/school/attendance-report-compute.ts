import type {
  AttendanceClassSummary,
  AttendanceReportData,
  AttendanceReportStudentRow,
} from '@/lib/db/attendance-reports';
import type {
  RepeatedAbsenceRow,
  RepeatedAbsencesReportData,
  StudentAttendanceHistoryData,
  StudentAttendanceHistoryRecord,
  WeeklyAttendanceReportData,
  WeeklyClassSummary,
} from '@/lib/db/attendance-reports-ext';
import type { ClassRow } from '@/lib/db/classes';
import type { EnrolledStudent } from '@/lib/db/enrolled-students';
import type { AttendanceStatus } from '@/lib/db/attendances';
import {
  getPeriodRange,
  getWeekRange,
  parseIsoDate,
  parseIsoDateWithFallback,
  shiftIsoDate,
  todayIsoDate,
} from '@/lib/date-utils';

type AttendanceInput = {
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
};

function buildSummary(rows: AttendanceReportStudentRow[]): Omit<
  AttendanceClassSummary,
  'class_id' | 'class_level' | 'class_name'
> {
  let present = 0;
  let absent = 0;
  let late = 0;
  let unmarked = 0;

  for (const row of rows) {
    if (!row.status) unmarked += 1;
    else if (row.status === 'present') present += 1;
    else if (row.status === 'absent') absent += 1;
    else if (row.status === 'late') late += 1;
  }

  const enrolled = rows.length;
  const marked = enrolled - unmarked;
  const markedRate = enrolled > 0 ? Math.round((marked / enrolled) * 100) : 0;

  return { enrolled, present, absent, late, unmarked, markedRate };
}

function attendancesInRange(
  attendances: AttendanceInput[],
  classIds: Set<string>,
  start: string,
  end: string,
): AttendanceInput[] {
  return attendances.filter(
    (a) =>
      classIds.has(a.class_id) && a.date >= start && a.date <= end,
  );
}

function byStudentDateMap(
  attendances: AttendanceInput[],
): Map<string, AttendanceStatus> {
  const map = new Map<string, AttendanceStatus>();
  for (const att of attendances) {
    map.set(`${att.student_id}:${att.date}`, att.status);
  }
  return map;
}

/** Rapport présences du jour (0 requête). */
export function computeAttendanceReport(input: {
  activeYear: { id: string; name: string };
  classes: ClassRow[];
  enrolled: EnrolledStudent[];
  attendances: AttendanceInput[];
  selectedDate: string;
  selectedClassId?: string | null;
}): AttendanceReportData {
  const {
    activeYear,
    classes,
    enrolled,
    attendances,
    selectedDate,
    selectedClassId: classParam,
  } = input;

  const selectedClassId =
    classParam && classes.some((c) => c.id === classParam) ? classParam : null;

  const scopedEnrolled = selectedClassId
    ? enrolled.filter((s) => s.class_id === selectedClassId)
    : enrolled;

  const dayAttendances = attendances.filter((a) => a.date === selectedDate);
  const attendanceByStudent = new Map<string, AttendanceStatus>();
  for (const att of dayAttendances) {
    attendanceByStudent.set(att.student_id, att.status);
  }

  const allRows: AttendanceReportStudentRow[] = scopedEnrolled
    .filter((s) => s.class_id && s.class_name && s.class_level)
    .map((s) => ({
      student_id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      matricule: s.matricule,
      class_id: s.class_id!,
      class_name: s.class_name!,
      class_level: s.class_level!,
      status: attendanceByStudent.get(s.id) ?? null,
    }));

  const classSummaries: AttendanceClassSummary[] = [];
  const classesToSummarize = selectedClassId
    ? classes.filter((c) => c.id === selectedClassId)
    : classes;

  for (const cls of classesToSummarize) {
    const classRows = allRows.filter((row) => row.class_id === cls.id);
    if (classRows.length === 0) continue;
    classSummaries.push({
      class_id: cls.id,
      class_level: cls.level,
      class_name: cls.name,
      ...buildSummary(classRows),
    });
  }

  const totals = buildSummary(allRows);
  const issueRows = allRows
    .filter(
      (row) => row.status === 'absent' || row.status === 'late' || !row.status,
    )
    .sort((a, b) => {
      const statusOrder = (status: AttendanceStatus | null) => {
        if (status === 'absent') return 0;
        if (status === 'late') return 1;
        return 2;
      };
      const diff = statusOrder(a.status) - statusOrder(b.status);
      if (diff !== 0) return diff;
      return `${a.last_name} ${a.first_name}`.localeCompare(
        `${b.last_name} ${b.first_name}`,
        'fr',
      );
    });

  return {
    activeYear,
    selectedDate,
    selectedClassId,
    classes,
    totals,
    classSummaries,
    issueRows,
  };
}

/** Synthèse hebdomadaire (0 requête). */
export function computeWeeklyAttendanceReport(input: {
  activeYear: { id: string; name: string };
  classes: ClassRow[];
  enrolled: EnrolledStudent[];
  attendances: AttendanceInput[];
  anchorDate: string;
  selectedClassId?: string | null;
}): WeeklyAttendanceReportData | null {
  const { activeYear, classes, enrolled, attendances, anchorDate, selectedClassId: classParam } =
    input;

  const { start, end, dayCount } = getWeekRange(anchorDate);
  if (dayCount <= 0) return null;

  const selectedClassId =
    classParam && classes.some((c) => c.id === classParam) ? classParam : null;

  const scopedClasses = selectedClassId
    ? classes.filter((c) => c.id === selectedClassId)
    : classes;
  const classIds = new Set(scopedClasses.map((c) => c.id));
  const rangeAttendances = attendancesInRange(attendances, classIds, start, end);
  const byStudentDate = byStudentDateMap(rangeAttendances);

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
    activeYear,
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

/** Absences répétées (0 requête). */
export function computeRepeatedAbsencesReport(input: {
  activeYear: { id: string; name: string };
  classes: ClassRow[];
  enrolled: EnrolledStudent[];
  attendances: AttendanceInput[];
  periodDays: number;
  minAbsences: number;
  selectedClassId?: string | null;
}): RepeatedAbsencesReportData {
  const {
    activeYear,
    classes,
    enrolled,
    attendances,
    periodDays,
    minAbsences,
    selectedClassId: classParam,
  } = input;

  const { start, end } = getPeriodRange(periodDays);
  const selectedClassId =
    classParam && classes.some((c) => c.id === classParam) ? classParam : null;

  const scopedEnrolled = selectedClassId
    ? enrolled.filter((s) => s.class_id === selectedClassId)
    : enrolled;

  const classIds = new Set(
    selectedClassId ? [selectedClassId] : classes.map((c) => c.id),
  );
  const rangeAttendances = attendancesInRange(attendances, classIds, start, end);
  const byStudent = new Map<string, { present: number; absent: number; late: number }>();

  for (const att of rangeAttendances) {
    const bucket = byStudent.get(att.student_id) ?? {
      present: 0,
      absent: 0,
      late: 0,
    };
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
    activeYear,
    periodDays,
    periodStart: start,
    periodEnd: end,
    selectedClassId,
    minAbsences,
    classes,
    rows,
  };
}

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

/** Historique élève (0 requête). */
export function computeStudentAttendanceHistory(input: {
  activeYear: { id: string; name: string };
  classes: ClassRow[];
  enrolled: EnrolledStudent[];
  attendances: AttendanceInput[];
  studentId?: string;
  startDate?: string;
  endDate?: string;
}): StudentAttendanceHistoryData {
  const { activeYear, classes, enrolled, attendances } = input;
  const studentId = input.studentId?.trim() ?? '';
  const endDate = parseIsoDateWithFallback(input.endDate, todayIsoDate());
  const startDate = parseIsoDateWithFallback(
    input.startDate,
    shiftIsoDate(endDate, -29),
  );

  const studentRow = studentId
    ? enrolled.find((s) => s.id === studentId)
    : undefined;

  const dayCount =
    Math.floor(
      (new Date(`${endDate}T12:00:00`).getTime() -
        new Date(`${startDate}T12:00:00`).getTime()) /
        86400000,
    ) + 1;

  if (!studentId) {
    return {
      activeYear,
      student: null,
      startDate,
      endDate,
      dayCount,
      classes,
      records: [],
      summary: { present: 0, absent: 0, late: 0, marked: 0, unmarked: 0 },
    };
  }

  if (!studentRow?.class_id || !studentRow.class_name || !studentRow.class_level) {
    return {
      activeYear,
      student: null,
      startDate,
      endDate,
      dayCount: 0,
      classes,
      records: [],
      summary: { present: 0, absent: 0, late: 0, marked: 0, unmarked: 0 },
    };
  }

  const records: StudentAttendanceHistoryRecord[] = attendances
    .filter(
      (a) =>
        a.student_id === studentId &&
        a.date >= startDate &&
        a.date <= endDate,
    )
    .map((att) => ({
      date: att.date,
      status: att.status,
      note: null,
    }));

  const { present, absent, late, marked } = countStatuses(records);

  return {
    activeYear,
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

export function parseAttendanceReportDate(raw: string | undefined): string {
  return parseIsoDate(raw);
}
