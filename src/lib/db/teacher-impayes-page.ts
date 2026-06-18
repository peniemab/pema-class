import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import { listEnrolledStudentsForYear } from '@/lib/db/enrolled-students';
import { listFeesForAcademicYearLabel } from '@/lib/db/fees';
import type { UnpaidStudentRow } from '@/lib/db/impayes-page';
import { listTeacherClassIds } from '@/lib/db/teacher-classes';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  applyScolaritePoolToBalances,
  buildRawStudentFeeBalances,
} from '@/lib/school/scolarite-balances';

export type TeacherImpayesPageData = {
  activeYear: { id: string; name: string } | null;
  classes: ClassRow[];
  rows: UnpaidStudentRow[];
  studentsWithDebt: number;
  filters: {
    search?: string;
    classId?: string;
  };
};

function matchesSearch(
  row: {
    first_name: string;
    last_name: string;
    matricule: string | null;
  },
  term: string,
): boolean {
  const full = `${row.last_name} ${row.first_name}`.toLowerCase();
  const reverse = `${row.first_name} ${row.last_name}`.toLowerCase();
  const matricule = (row.matricule ?? '').toLowerCase();
  return (
    full.includes(term) ||
    reverse.includes(term) ||
    matricule.includes(term)
  );
}

export async function getTeacherImpayesSummary(
  schoolId: string,
  staffId: string,
): Promise<{ studentsWithDebt: number }> {
  const data = await getTeacherImpayesPageData(schoolId, staffId, {});
  return { studentsWithDebt: data.studentsWithDebt };
}

/** Impayés limités aux classes de l'enseignant (relance en salle). */
export async function getTeacherImpayesPageData(
  schoolId: string,
  staffId: string,
  searchParams: Record<string, string | undefined>,
): Promise<TeacherImpayesPageData> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) {
    return {
      activeYear: null,
      classes: [],
      rows: [],
      studentsWithDebt: 0,
      filters: {},
    };
  }

  const classIds = await listTeacherClassIds(
    schoolId,
    activeYear.id,
    staffId,
  );
  const allClasses = await listClassesForYear(schoolId, activeYear.id);
  const classes = allClasses.filter((c) => classIds.includes(c.id));

  if (classIds.length === 0) {
    return {
      activeYear: { id: activeYear.id, name: activeYear.name },
      classes: [],
      rows: [],
      studentsWithDebt: 0,
      filters: {
        search: searchParams.q?.trim() || undefined,
        classId: searchParams.classe || undefined,
      },
    };
  }

  const fees = await listFeesForAcademicYearLabel(schoolId, activeYear.name);
  const enrolled = (
    await listEnrolledStudentsForYear(schoolId, activeYear.id)
  ).filter((s) => s.class_id && classIds.includes(s.class_id));

  if (enrolled.length === 0 || fees.length === 0) {
    return {
      activeYear: { id: activeYear.id, name: activeYear.name },
      classes,
      rows: [],
      studentsWithDebt: 0,
      filters: {
        search: searchParams.q?.trim() || undefined,
        classId: searchParams.classe || undefined,
      },
    };
  }

  const feeIds = fees.map((f) => f.id);
  const studentIds = enrolled.map((s) => s.id);
  const admin = createAdminClient();

  const { data: paymentRows, error: payError } = await admin
    .from('payments_history')
    .select('student_id, fee_id, amount_paid')
    .in('fee_id', feeIds)
    .in('student_id', studentIds);
  if (payError) throw new Error(payError.message);

  const paidByStudentFee = new Map<string, number>();
  for (const row of paymentRows ?? []) {
    const raw = row as {
      student_id: string;
      fee_id: string;
      amount_paid: number;
    };
    const key = `${raw.student_id}:${raw.fee_id}`;
    paidByStudentFee.set(
      key,
      (paidByStudentFee.get(key) ?? 0) + Number(raw.amount_paid),
    );
  }

  const studentMap = new Map(enrolled.map((s) => [s.id, s]));
  const byStudent = new Map<
    string,
    { cdf: number; usd: number; feeIds: Set<string> }
  >();

  for (const student of enrolled) {
    const paidByFee = new Map<string, number>();
    for (const fee of fees) {
      const paid = paidByStudentFee.get(`${student.id}:${fee.id}`) ?? 0;
      if (paid > 0) paidByFee.set(fee.id, paid);
    }
    const raw = buildRawStudentFeeBalances(fees, paidByFee);
    const balances = applyScolaritePoolToBalances(raw).balances;

    for (const line of balances) {
      if (line.amount_remaining <= 0.001) continue;
      const agg = byStudent.get(student.id) ?? {
        cdf: 0,
        usd: 0,
        feeIds: new Set<string>(),
      };
      if (line.currency === 'USD') {
        agg.usd += line.amount_remaining;
      } else {
        agg.cdf += line.amount_remaining;
      }
      agg.feeIds.add(line.fee_id);
      byStudent.set(student.id, agg);
    }
  }

  let rows: UnpaidStudentRow[] = [];
  for (const [studentId, agg] of byStudent) {
    const student = studentMap.get(studentId);
    if (!student) continue;
    rows.push({
      student_id: studentId,
      first_name: student.first_name,
      last_name: student.last_name,
      matricule: student.matricule,
      class_id: student.class_id,
      class_name: student.class_name,
      class_level: student.class_level,
      unpaid_fee_count: agg.feeIds.size,
      remaining_cdf: agg.cdf,
      remaining_usd: agg.usd,
    });
  }

  rows.sort((a, b) => {
    const byLast = a.last_name.localeCompare(b.last_name, 'fr');
    if (byLast !== 0) return byLast;
    return a.first_name.localeCompare(b.first_name, 'fr');
  });

  const search = searchParams.q?.trim().toLowerCase() ?? '';
  if (search) {
    rows = rows.filter((r) => matchesSearch(r, search));
  }

  const classId = searchParams.classe?.trim();
  if (classId && classIds.includes(classId)) {
    rows = rows.filter((r) => r.class_id === classId);
  }

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes,
    rows,
    studentsWithDebt: rows.length,
    filters: {
      search: searchParams.q?.trim() || undefined,
      classId: classId || undefined,
    },
  };
}
