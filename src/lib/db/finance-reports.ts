import { cache } from 'react';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import { listEnrolledStudentsForYear } from '@/lib/db/enrolled-students';
import { listFeesForAcademicYearLabel } from '@/lib/db/fees';
import type { ImpayesStats, UnpaidStudentRow } from '@/lib/db/impayes-page';
import { getImpayesPageData } from '@/lib/db/impayes-page';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  normalizeSchoolCycles,
  CYCLE_DISPLAY_ORDER,
  levelToCycle,
  SCHOOL_CYCLE_LABELS,
  type SchoolCycle,
} from '@/lib/school/referentials/constants';
import { getSchoolByIdForStaff } from '@/lib/db/schools';
import type { FeeRow } from '@/lib/db/fees';

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shiftIsoDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseDate(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return todayIsoDate();
  return raw;
}

export type CashJournalRow = {
  id: string;
  created_at: string;
  receipt_number: string;
  student_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  class_level: string | null;
  class_name: string | null;
  fee_name: string;
  amount_paid: number;
  currency: string;
};

export type CashJournalReportData = {
  activeYear: { id: string; name: string };
  selectedDate: string;
  totals: { count: number; cdf: number; usd: number };
  rows: CashJournalRow[];
};

export type ImpayesReportData = {
  activeYear: { id: string; name: string };
  selectedClassId: string | null;
  selectedFeeId: string | null;
  classes: ClassRow[];
  fees: FeeRow[];
  stats: ImpayesStats;
  rows: UnpaidStudentRow[];
};

export type ClassEnrollmentRow = {
  class_id: string;
  class_level: string;
  class_name: string;
  cycle: SchoolCycle;
  enrolled: number;
  max_capacity: number;
  fill_rate: number;
};

export type EnrollmentReportData = {
  activeYear: { id: string; name: string };
  schoolName: string;
  offeredCycles: SchoolCycle[];
  classes: ClassRow[];
  rows: ClassEnrollmentRow[];
  byCycle: { cycle: SchoolCycle; label: string; class_count: number; enrolled: number }[];
  totals: { class_count: number; enrolled: number; capacity: number };
};

export type RapportsHubPreview = {
  cashTodayCdf: number | null;
  cashTodayCount: number | null;
  studentsWithDebt: number | null;
  totalEnrolled: number | null;
};

async function fetchCashJournalReport(
  schoolId: string,
  searchParams: Record<string, string | undefined>,
): Promise<CashJournalReportData | null> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  const fees = await listFeesForAcademicYearLabel(schoolId, activeYear.name);
  const enrolled = await listEnrolledStudentsForYear(schoolId, activeYear.id);
  const studentById = new Map(enrolled.map((s) => [s.id, s]));
  const feeById = new Map(fees.map((f) => [f.id, f]));
  const feeIds = fees.map((f) => f.id);

  const selectedDate = parseDate(searchParams.date);
  const nextDate = shiftIsoDate(selectedDate, 1);

  if (feeIds.length === 0) {
    return {
      activeYear: { id: activeYear.id, name: activeYear.name },
      selectedDate,
      totals: { count: 0, cdf: 0, usd: 0 },
      rows: [],
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('payments_history')
    .select(
      'id, student_id, fee_id, amount_paid, currency, receipt_number, created_at',
    )
    .in('fee_id', feeIds)
    .gte('created_at', `${selectedDate}T00:00:00.000Z`)
    .lt('created_at', `${nextDate}T00:00:00.000Z`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const rows: CashJournalRow[] = [];
  let cdf = 0;
  let usd = 0;

  for (const raw of data ?? []) {
    const row = raw as {
      id: string;
      student_id: string;
      fee_id: string;
      amount_paid: number;
      currency: string;
      receipt_number: string;
      created_at: string;
    };
    const student = studentById.get(row.student_id);
    if (!student) continue;

    const amount = Number(row.amount_paid);
    const currency = row.currency ?? 'CDF';
    if (currency === 'USD') usd += amount;
    else cdf += amount;

    rows.push({
      id: row.id,
      created_at: row.created_at,
      receipt_number: row.receipt_number,
      student_id: row.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      matricule: student.matricule,
      class_level: student.class_level,
      class_name: student.class_name,
      fee_name: feeById.get(row.fee_id)?.name ?? '—',
      amount_paid: amount,
      currency,
    });
  }

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    selectedDate,
    totals: { count: rows.length, cdf, usd },
    rows,
  };
}

async function fetchImpayesReportData(
  schoolId: string,
  searchParams: Record<string, string | undefined>,
): Promise<ImpayesReportData | null> {
  const data = await getImpayesPageData(schoolId, { ...searchParams, all: '1', page: '1' });
  if (!data.activeYear || !data.stats) return null;

  return {
    activeYear: data.activeYear,
    selectedClassId: searchParams.classe?.trim() || null,
    selectedFeeId: searchParams.frais?.trim() || null,
    classes: data.classes,
    fees: data.fees,
    stats: data.stats,
    rows: data.rows,
  };
}

async function fetchEnrollmentReport(
  schoolId: string,
): Promise<EnrollmentReportData | null> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  const [school, classes, enrolled] = await Promise.all([
    getSchoolByIdForStaff(schoolId),
    listClassesForYear(schoolId, activeYear.id),
    listEnrolledStudentsForYear(schoolId, activeYear.id),
  ]);

  const offeredCycles = normalizeSchoolCycles(school?.offered_cycles);
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

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    schoolName: school?.display_name ?? school?.name ?? 'Établissement',
    offeredCycles,
    classes,
    rows,
    byCycle,
    totals: {
      class_count: rows.length,
      enrolled: enrolled.length,
      capacity: rows.reduce((s, r) => s + r.max_capacity, 0),
    },
  };
}

async function fetchRapportsHubPreview(
  schoolId: string,
): Promise<RapportsHubPreview> {
  const [cash, impayes, enrollment] = await Promise.all([
    fetchCashJournalReport(schoolId, {}),
    fetchImpayesReportData(schoolId, {}),
    fetchEnrollmentReport(schoolId),
  ]);

  return {
    cashTodayCdf: cash?.totals.cdf ?? null,
    cashTodayCount: cash?.totals.count ?? null,
    studentsWithDebt: impayes?.stats.studentsWithDebt ?? null,
    totalEnrolled: enrollment?.totals.enrolled ?? null,
  };
}

export const getCashJournalReport = cache(fetchCashJournalReport);
export const getImpayesReportData = cache(fetchImpayesReportData);
export const getEnrollmentReport = cache(fetchEnrollmentReport);
export const getRapportsHubPreview = cache(fetchRapportsHubPreview);
