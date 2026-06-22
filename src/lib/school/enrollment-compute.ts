import type {
  ClassEnrollmentRow,
  EnrollmentReportData,
} from '@/lib/db/finance-reports';
import type { ClassRow } from '@/lib/db/classes';
import type { EnrolledStudent } from '@/lib/db/enrolled-students';
import {
  CYCLE_DISPLAY_ORDER,
  levelToCycle,
  SCHOOL_CYCLE_LABELS,
  type SchoolCycle,
} from '@/lib/school/referentials/constants';

type ClassInput = Pick<
  ClassRow,
  | 'id'
  | 'school_id'
  | 'academic_year_id'
  | 'name'
  | 'level'
  | 'cycle'
  | 'max_capacity'
  | 'current_count'
>;

/** Cycles dérivés des classes quand offered_cycles n'est pas en mémoire. */
export function offeredCyclesFromClasses(classes: ClassInput[]): SchoolCycle[] {
  const set = new Set<SchoolCycle>();
  for (const cls of classes) {
    set.add((cls.cycle ?? levelToCycle(cls.level)) as SchoolCycle);
  }
  if (set.size === 0) return ['primaire'];
  return CYCLE_DISPLAY_ORDER.filter((c) => set.has(c));
}

/** Effectifs par classe à partir de données déjà en mémoire (0 requête). */
export function computeEnrollmentReport(input: {
  activeYear: { id: string; name: string };
  schoolName: string;
  offeredCycles: SchoolCycle[];
  classes: ClassInput[];
  enrolled: EnrolledStudent[];
}): EnrollmentReportData {
  const { activeYear, schoolName, offeredCycles, classes, enrolled } = input;

  const countByClass = new Map<string, number>();
  for (const student of enrolled) {
    if (!student.class_id) continue;
    countByClass.set(student.class_id, (countByClass.get(student.class_id) ?? 0) + 1);
  }

  const rows: ClassEnrollmentRow[] = classes.map((cls) => {
    const enrolledCount = countByClass.get(cls.id) ?? 0;
    const cycle = (cls.cycle ?? levelToCycle(cls.level)) as SchoolCycle;
    const max = cls.max_capacity > 0 ? cls.max_capacity : 30;
    return {
      class_id: cls.id,
      class_level: cls.level,
      class_name: cls.name,
      cycle,
      enrolled: enrolledCount,
      max_capacity: max,
      fill_rate: max > 0 ? Math.round((enrolledCount / max) * 100) : 0,
    };
  });

  rows.sort((a, b) =>
    `${a.class_level} ${a.class_name}`.localeCompare(
      `${b.class_level} ${b.class_name}`,
      'fr',
    ),
  );

  const byCycle = CYCLE_DISPLAY_ORDER.filter((c) => offeredCycles.includes(c)).map(
    (cycle) => {
      const cycleRows = rows.filter((r) => r.cycle === cycle);
      return {
        cycle,
        label: SCHOOL_CYCLE_LABELS[cycle],
        class_count: cycleRows.length,
        enrolled: cycleRows.reduce((s, r) => s + r.enrolled, 0),
      };
    },
  );

  const classRows: ClassRow[] = classes.map((cls) => ({
    ...cls,
    created_at: '',
  }));

  return {
    activeYear,
    schoolName,
    offeredCycles,
    classes: classRows,
    rows,
    byCycle,
    totals: {
      class_count: rows.length,
      enrolled: enrolled.length,
      capacity: rows.reduce((s, r) => s + r.max_capacity, 0),
    },
  };
}
