import type { ClassRow } from '@/lib/db/classes';
import type { EnrolledStudent } from '@/lib/db/enrolled-students';
import type { EnrollmentReportData } from '@/lib/db/finance-reports';
import type { AppDataValue } from '@/lib/offline/app-data-context';
import {
  computeEnrollmentReport,
  offeredCyclesFromClasses,
} from '@/lib/school/enrollment-compute';

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

/** Effectifs depuis AppData (affichage instantané). */
export function buildEnrollmentFromAppData(
  data: AppDataValue,
  schoolName?: string,
): EnrollmentReportData | null {
  const activeYear =
    data.studentsState?.activeYear ?? data.caisseState?.activeYear ?? null;
  if (!activeYear) return null;
  if (data.students.length === 0 && data.classes.length === 0) return null;

  const classes = data.classes
    .filter((c) => c.academic_year_id === activeYear.id)
    .map(toClassRow);

  const enrolled = data.students
    .filter((s) => s.status === 'active')
    .map(toEnrolledStudent);

  return computeEnrollmentReport({
    activeYear,
    schoolName: schoolName ?? '',
    offeredCycles: offeredCyclesFromClasses(classes),
    classes,
    enrolled,
  });
}
