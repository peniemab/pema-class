import type { ClassRow } from '@/lib/db/classes';
import type { EnrolledStudent } from '@/lib/db/enrolled-students';
import type { FeeRow } from '@/lib/db/fees';
import type { ImpayesPageData, ImpayesRecouvrementPageData } from '@/lib/db/impayes-page';
import type { ImpayesReportData } from '@/lib/db/finance-reports';
import type { AppDataValue } from '@/lib/offline/app-data-context';
import {
  buildPaidByStudentFee,
  computeImpayesPageData,
  computeRecouvrementPageData,
} from '@/lib/school/impayes-compute';

function appDataBundle(data: AppDataValue) {
  const activeYear =
    data.caisseState?.activeYear ?? data.studentsState?.activeYear ?? null;
  if (!activeYear) return null;

  const enrolled = data.students
    .filter((s) => s.status === 'active')
    .map(toEnrolledStudent);

  const fees = data.fees
    .filter((f) => f.academic_year === activeYear.name)
    .map(toFeeRow);

  const classes = data.classes
    .filter((c) => c.academic_year_id === activeYear.id)
    .map(toClassRow);

  const paidByStudentFee = buildPaidByStudentFee(
    data.payments.map((p) => ({
      student_id: p.student_id,
      fee_id: p.fee_id,
      amount_paid: p.amount_paid,
    })),
  );

  return { activeYear, enrolled, fees, classes, paidByStudentFee };
}

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

function toFeeRow(f: AppDataValue['fees'][number]): FeeRow {
  return {
    id: f.id,
    school_id: f.school_id,
    name: f.name,
    amount: f.amount,
    currency: f.currency,
    academic_year: f.academic_year,
    created_at: '',
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

/** Synthèse impayés depuis le magasin AppData (affichage instantané). */
export function buildImpayesFromAppData(data: AppDataValue): ImpayesPageData | null {
  const bundle = appDataBundle(data);
  if (!bundle) return null;
  if (data.students.length === 0 && data.fees.length === 0) return null;

  const { activeYear, enrolled, fees, classes, paidByStudentFee } = bundle;

  return computeImpayesPageData({
    activeYear,
    fees,
    classes,
    enrolled,
    paidByStudentFee,
    filters: { page: 1 },
  });
}

function impayesPageFromAppData(
  data: AppDataValue,
  filters: { search?: string; classId?: string; feeId?: string },
): ImpayesPageData | null {
  const bundle = appDataBundle(data);
  if (!bundle) return null;

  const { activeYear, enrolled, fees, classes, paidByStudentFee } = bundle;

  return computeImpayesPageData({
    activeYear,
    fees,
    classes,
    enrolled,
    paidByStudentFee,
    filters: {
      search: filters.search?.trim() || undefined,
      classId: filters.classId || undefined,
      feeId: filters.feeId || undefined,
      page: 1,
    },
    allRows: true,
  });
}

/** Rapport impayés (synthèse / liste) depuis AppData. */
export function buildImpayesReportFromAppData(
  data: AppDataValue,
  params: { search?: string; classId?: string; feeId?: string } = {},
): ImpayesReportData | null {
  const page = impayesPageFromAppData(data, params);
  if (!page?.activeYear || !page.stats) return null;

  return {
    activeYear: page.activeYear,
    selectedClassId: params.classId?.trim() || null,
    selectedFeeId: params.feeId?.trim() || null,
    classes: page.classes,
    fees: page.fees,
    stats: page.stats,
    rows: page.rows,
  };
}

/** Recouvrement par frais depuis AppData (affichage instantané). */
export function buildRecouvrementFromAppData(
  data: AppDataValue,
  params: {
    feeId: string;
    search?: string;
    classId?: string;
    schoolName?: string;
  },
): ImpayesRecouvrementPageData | null {
  const bundle = appDataBundle(data);
  if (!bundle) return null;

  const { activeYear, enrolled, fees, classes, paidByStudentFee } = bundle;

  return computeRecouvrementPageData({
    activeYear,
    schoolName: params.schoolName ?? '',
    fees,
    classes,
    enrolled,
    paidByStudentFee,
    feeId: params.feeId,
    filters: {
      feeId: params.feeId,
      search: params.search,
      classId: params.classId,
    },
  });
}
