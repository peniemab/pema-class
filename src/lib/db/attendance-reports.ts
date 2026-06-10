import { cache } from 'react';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import {
  listAttendancesForStudentsOnDate,
  type AttendanceStatus,
} from '@/lib/db/attendances';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import { listEnrolledStudentsForYear } from '@/lib/db/enrolled-students';

export type AttendanceReportStudentRow = {
  student_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  class_id: string;
  class_name: string;
  class_level: string;
  status: AttendanceStatus | null;
};

export type AttendanceClassSummary = {
  class_id: string;
  class_level: string;
  class_name: string;
  enrolled: number;
  present: number;
  absent: number;
  late: number;
  unmarked: number;
  markedRate: number;
};

export type AttendanceReportData = {
  activeYear: { id: string; name: string } | null;
  selectedDate: string;
  selectedClassId: string | null;
  classes: ClassRow[];
  totals: {
    enrolled: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
    markedRate: number;
  };
  classSummaries: AttendanceClassSummary[];
  issueRows: AttendanceReportStudentRow[];
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return todayIsoDate();
  return raw;
}

function buildSummary(
  rows: AttendanceReportStudentRow[],
): Omit<AttendanceClassSummary, 'class_id' | 'class_level' | 'class_name'> & {
  markedRate: number;
} {
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

async function fetchAttendanceReportData(
  schoolId: string,
  searchParams: Record<string, string | undefined>,
): Promise<AttendanceReportData | null> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  const selectedDate = parseDate(searchParams.date);
  const classes = await listClassesForYear(schoolId, activeYear.id);

  const classParam = searchParams.classe?.trim();
  const selectedClassId =
    classParam && classes.some((c) => c.id === classParam) ? classParam : null;

  const enrolled = await listEnrolledStudentsForYear(schoolId, activeYear.id);
  const scopedEnrolled = selectedClassId
    ? enrolled.filter((s) => s.class_id === selectedClassId)
    : enrolled;

  const studentIds = scopedEnrolled.map((s) => s.id);
  const attendanceByStudent = await listAttendancesForStudentsOnDate(
    studentIds,
    selectedDate,
  );

  const allRows: AttendanceReportStudentRow[] = scopedEnrolled
    .filter((s) => s.class_id && s.class_name && s.class_level)
    .map((s) => {
      const att = attendanceByStudent.get(s.id);
      return {
        student_id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        matricule: s.matricule,
        class_id: s.class_id!,
        class_name: s.class_name!,
        class_level: s.class_level!,
        status: att?.status ?? null,
      };
    });

  const classSummaries: AttendanceClassSummary[] = [];
  const classesToSummarize = selectedClassId
    ? classes.filter((c) => c.id === selectedClassId)
    : classes;

  for (const cls of classesToSummarize) {
    const classRows = allRows.filter((row) => row.class_id === cls.id);
    if (classRows.length === 0) continue;
    const summary = buildSummary(classRows);
    classSummaries.push({
      class_id: cls.id,
      class_level: cls.level,
      class_name: cls.name,
      ...summary,
    });
  }

  const totals = buildSummary(allRows);
  const issueRows = allRows
    .filter((row) => row.status === 'absent' || row.status === 'late' || !row.status)
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
    activeYear: { id: activeYear.id, name: activeYear.name },
    selectedDate,
    selectedClassId,
    classes,
    totals,
    classSummaries,
    issueRows,
  };
}

export const getAttendanceReportData = cache(fetchAttendanceReportData);
