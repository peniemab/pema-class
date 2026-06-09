import { cache } from 'react';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import { listEnrolledStudentsForYear, type EnrolledStudent } from '@/lib/db/enrolled-students';
import { listFeesForAcademicYearLabel, type FeeRow } from '@/lib/db/fees';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  applyScolaritePoolToBalances,
  buildRawStudentFeeBalances,
  hasScolariteTranches,
  isScolaritePoolAggregateFee,
  scolaritePoolFeeId,
  scolaritePoolSummaryForStudent,
  SCOLARITE_POOL_VIRTUAL_FEE_ID,
} from '@/lib/school/scolarite-balances';
import {
  FEE_ANNUAL_LUMP_LABEL,
  feeTrancheSortOrder,
  isAnnualScolariteFee,
  isScolariteFeeName,
  isTrancheScolariteFee,
} from '@/lib/school/referentials/constants';

const PAGE_SIZE = 30;

export type UnpaidStudentRow = {
  student_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  class_id: string | null;
  class_name: string | null;
  class_level: string | null;
  unpaid_fee_count: number;
  remaining_cdf: number;
  remaining_usd: number;
};

export type FeeBreakdownStat = {
  fee_id: string;
  fee_name: string;
  currency: string;
  total_expected: number;
  total_collected: number;
  total_remaining: number;
  student_count: number;
  /** Card agrégée T1+T2+T3 (pool scolarité). */
  is_scolarite_pool?: boolean;
};

export type ImpayesStats = {
  enrolledCount: number;
  studentsWithDebt: number;
  studentsUpToDate: number;
  totalUnpaidCdf: number;
  totalUnpaidUsd: number;
  feeBreakdown: FeeBreakdownStat[];
};

export type ImpayesFilters = {
  search?: string;
  classId?: string;
  feeId?: string;
  page: number;
};

export type RecouvrementStudentRow = {
  student_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  class_id: string | null;
  class_name: string | null;
  class_level: string | null;
  amount_remaining: number;
  currency: string;
};

export type ImpayesRecouvrementPageData = {
  activeYear: { id: string; name: string };
  schoolName: string;
  fee: FeeRow;
  feeStat: FeeBreakdownStat;
  rows: RecouvrementStudentRow[];
  classes: ClassRow[];
  fees: FeeRow[];
  filters: Pick<ImpayesFilters, 'search' | 'classId' | 'feeId'>;
};

export type ImpayesPageData = {
  activeYear: { id: string; name: string } | null;
  fees: FeeRow[];
  classes: ClassRow[];
  stats: ImpayesStats | null;
  rows: UnpaidStudentRow[];
  total: number;
  page: number;
  pageSize: number;
  filters: ImpayesFilters;
};

type UnpaidLineInternal = {
  student_id: string;
  class_id: string | null;
  fee_id: string;
  fee_name: string;
  amount_remaining: number;
  currency: string;
};

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function matchesSearch(row: EnrolledStudent, term: string): boolean {
  const full = `${row.last_name} ${row.first_name}`.toLowerCase();
  const reverse = `${row.first_name} ${row.last_name}`.toLowerCase();
  const matricule = (row.matricule ?? '').toLowerCase();
  return (
    full.includes(term) ||
    reverse.includes(term) ||
    matricule.includes(term)
  );
}

function aggregateStudents(
  enrolled: EnrolledStudent[],
  unpaidLines: UnpaidLineInternal[],
): UnpaidStudentRow[] {
  const studentMap = new Map(enrolled.map((s) => [s.id, s]));
  const byStudent = new Map<
    string,
    { cdf: number; usd: number; feeIds: Set<string> }
  >();

  for (const line of unpaidLines) {
    const agg = byStudent.get(line.student_id) ?? {
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
    byStudent.set(line.student_id, agg);
  }

  const rows: UnpaidStudentRow[] = [];
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

  return rows;
}

function studentDisplayBalances(
  studentId: string,
  fees: { id: string; name: string; amount: number; currency: string }[],
  paidByStudentFee: Map<string, number>,
) {
  const paidByFee = new Map<string, number>();
  for (const fee of fees) {
    const paid = paidByStudentFee.get(`${studentId}:${fee.id}`) ?? 0;
    if (paid > 0) paidByFee.set(fee.id, paid);
  }
  const raw = buildRawStudentFeeBalances(fees, paidByFee);
  return applyScolaritePoolToBalances(raw).balances;
}

function buildFeeBreakdown(
  fees: FeeRow[],
  enrolled: EnrolledStudent[],
  paidByStudentFee: Map<string, number>,
): FeeBreakdownStat[] {
  const trancheFees = fees
    .filter((f) => isTrancheScolariteFee(f.name))
    .sort(
      (a, b) =>
        feeTrancheSortOrder(a.name) - feeTrancheSortOrder(b.name) ||
        a.name.localeCompare(b.name, 'fr'),
    );
  const fixedFees = fees.filter((f) => !isScolariteFeeName(f.name));
  const hasTranches = trancheFees.length > 0;

  function statForFee(fee: FeeRow): FeeBreakdownStat {
    let totalCollected = 0;
    let totalRemaining = 0;
    let studentCount = 0;

    for (const student of enrolled) {
      const balances = studentDisplayBalances(
        student.id,
        fees,
        paidByStudentFee,
      );
      const line = balances.find((b) => b.fee_id === fee.id);
      if (!line) continue;
      totalCollected += line.amount_paid;
      totalRemaining += line.amount_remaining;
      if (line.amount_remaining > 0.001) studentCount += 1;
    }

    return {
      fee_id: fee.id,
      fee_name: fee.name,
      currency: fee.currency,
      total_expected: Number(fee.amount) * enrolled.length,
      total_collected: totalCollected,
      total_remaining: totalRemaining,
      student_count: studentCount,
    };
  }

  const result: FeeBreakdownStat[] = [];

  if (hasTranches) {
    const trancheTotalPerStudent = trancheFees.reduce(
      (sum, f) => sum + Number(f.amount),
      0,
    );
    const currency = trancheFees[0].currency;
    let poolCollected = 0;
    let poolRemaining = 0;
    let poolStudentCount = 0;

    for (const student of enrolled) {
      const summary = scolaritePoolSummaryForStudent(
        student.id,
        fees,
        paidByStudentFee,
      );
      if (!summary) continue;
      poolCollected += summary.total_paid;
      poolRemaining += summary.total_remaining;
      if (summary.total_remaining > 0.001) poolStudentCount += 1;
    }

    result.push({
      fee_id: scolaritePoolFeeId(fees),
      fee_name: FEE_ANNUAL_LUMP_LABEL,
      currency,
      total_expected: trancheTotalPerStudent * enrolled.length,
      total_collected: poolCollected,
      total_remaining: poolRemaining,
      student_count: poolStudentCount,
      is_scolarite_pool: true,
    });

    for (const fee of trancheFees) {
      result.push(statForFee(fee));
    }
  } else {
    for (const fee of fees.filter((f) => isScolariteFeeName(f.name))) {
      result.push(statForFee(fee));
    }
  }

  for (const fee of fixedFees) {
    result.push(statForFee(fee));
  }

  return result;
}

function buildPoolDisplayFee(fees: FeeRow[]): FeeRow {
  const trancheFees = fees.filter((f) => isTrancheScolariteFee(f.name));
  const trancheTotal = trancheFees.reduce((sum, f) => sum + Number(f.amount), 0);
  const annual = fees.find((f) => isAnnualScolariteFee(f.name));
  const base = annual ?? trancheFees[0] ?? fees[0];
  return {
    ...base,
    id: scolaritePoolFeeId(fees),
    name: FEE_ANNUAL_LUMP_LABEL,
    amount: trancheTotal,
    currency: trancheFees[0]?.currency ?? base.currency,
  };
}

function resolveRecouvrementFee(
  feeId: string,
  fees: FeeRow[],
): { fee: FeeRow; isPoolView: boolean } | null {
  if (feeId === SCOLARITE_POOL_VIRTUAL_FEE_ID) {
    if (!hasScolariteTranches(fees)) return null;
    return { fee: buildPoolDisplayFee(fees), isPoolView: true };
  }

  const feeFromDb = fees.find((f) => f.id === feeId);
  if (!feeFromDb) return null;

  if (isScolaritePoolAggregateFee(feeFromDb, fees)) {
    return { fee: buildPoolDisplayFee(fees), isPoolView: true };
  }

  return { fee: feeFromDb, isPoolView: false };
}

async function fetchImpayesPageData(
  schoolId: string,
  searchParams: Record<string, string | undefined>,
): Promise<ImpayesPageData> {
  const filters: ImpayesFilters = {
    search: searchParams.q?.trim() || undefined,
    classId: searchParams.classe || undefined,
    feeId: searchParams.frais || undefined,
    page: parsePage(searchParams.page),
  };

  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) {
    return {
      activeYear: null,
      fees: [],
      classes: [],
      stats: null,
      rows: [],
      total: 0,
      page: filters.page,
      pageSize: PAGE_SIZE,
      filters,
    };
  }

  const [fees, classes, enrolled] = await Promise.all([
    listFeesForAcademicYearLabel(schoolId, activeYear.name),
    listClassesForYear(schoolId, activeYear.id),
    listEnrolledStudentsForYear(schoolId, activeYear.id),
  ]);

  const emptyStats: ImpayesStats = {
    enrolledCount: enrolled.length,
    studentsWithDebt: 0,
    studentsUpToDate: enrolled.length,
    totalUnpaidCdf: 0,
    totalUnpaidUsd: 0,
    feeBreakdown: buildFeeBreakdown(fees, enrolled, new Map()),
  };

  if (fees.length === 0 || enrolled.length === 0) {
    return {
      activeYear: { id: activeYear.id, name: activeYear.name },
      fees,
      classes,
      stats: emptyStats,
      rows: [],
      total: 0,
      page: filters.page,
      pageSize: PAGE_SIZE,
      filters,
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
    const raw = row as { student_id: string; fee_id: string; amount_paid: number };
    const key = `${raw.student_id}:${raw.fee_id}`;
    paidByStudentFee.set(
      key,
      (paidByStudentFee.get(key) ?? 0) + Number(raw.amount_paid),
    );
  }

  const unpaidLines: UnpaidLineInternal[] = [];

  for (const student of enrolled) {
    const balances = studentDisplayBalances(
      student.id,
      fees,
      paidByStudentFee,
    );
    for (const line of balances) {
      if (line.amount_remaining <= 0.001) continue;
      unpaidLines.push({
        student_id: student.id,
        class_id: student.class_id,
        fee_id: line.fee_id,
        fee_name: line.fee_name,
        amount_remaining: line.amount_remaining,
        currency: line.currency,
      });
    }
  }

  const stats: ImpayesStats = {
    enrolledCount: enrolled.length,
    studentsWithDebt: new Set(unpaidLines.map((l) => l.student_id)).size,
    studentsUpToDate:
      enrolled.length - new Set(unpaidLines.map((l) => l.student_id)).size,
    totalUnpaidCdf: unpaidLines
      .filter((l) => l.currency !== 'USD')
      .reduce((sum, l) => sum + l.amount_remaining, 0),
    totalUnpaidUsd: unpaidLines
      .filter((l) => l.currency === 'USD')
      .reduce((sum, l) => sum + l.amount_remaining, 0),
    feeBreakdown: buildFeeBreakdown(fees, enrolled, paidByStudentFee),
  };

  let studentRows = aggregateStudents(enrolled, unpaidLines);

  const search = filters.search?.toLowerCase() ?? '';
  if (search) {
    studentRows = studentRows.filter((r) =>
      matchesSearch(
        {
          id: r.student_id,
          first_name: r.first_name,
          last_name: r.last_name,
          matricule: r.matricule,
          class_id: r.class_id,
          class_name: r.class_name,
          class_level: r.class_level,
        },
        search,
      ),
    );
  }

  if (filters.classId) {
    studentRows = studentRows.filter((r) => r.class_id === filters.classId);
  }

  if (filters.feeId) {
    const selectedFee = fees.find((f) => f.id === filters.feeId);
    if (selectedFee && isScolaritePoolAggregateFee(selectedFee, fees)) {
      const studentsWithPoolDebt = new Set<string>();
      for (const student of enrolled) {
        const summary = scolaritePoolSummaryForStudent(
          student.id,
          fees,
          paidByStudentFee,
        );
        if (summary && summary.total_remaining > 0.001) {
          studentsWithPoolDebt.add(student.id);
        }
      }
      studentRows = studentRows.filter((r) =>
        studentsWithPoolDebt.has(r.student_id),
      );
    } else {
      const studentsWithFee = new Set(
        unpaidLines
          .filter((l) => l.fee_id === filters.feeId)
          .map((l) => l.student_id),
      );
      studentRows = studentRows.filter((r) => studentsWithFee.has(r.student_id));
    }
  }

  const total = studentRows.length;
  const start = (filters.page - 1) * PAGE_SIZE;
  const rows = studentRows.slice(start, start + PAGE_SIZE);

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    fees,
    classes,
    stats,
    rows,
    total,
    page: filters.page,
    pageSize: PAGE_SIZE,
    filters,
  };
}

export const getImpayesPageData = cache(fetchImpayesPageData);

async function fetchImpayesRecouvrementPageData(
  schoolId: string,
  searchParams: Record<string, string | undefined>,
): Promise<ImpayesRecouvrementPageData | null> {
  const feeId = searchParams.frais?.trim();
  if (!feeId) return null;

  const filters = {
    search: searchParams.q?.trim() || undefined,
    classId: searchParams.classe || undefined,
    feeId,
  };

  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  const { getSchoolByIdForStaff } = await import('@/lib/db/schools');
  const school = await getSchoolByIdForStaff(schoolId);
  if (!school) return null;

  const [fees, enrolled, classes] = await Promise.all([
    listFeesForAcademicYearLabel(schoolId, activeYear.name),
    listEnrolledStudentsForYear(schoolId, activeYear.id),
    listClassesForYear(schoolId, activeYear.id),
  ]);

  const resolved = resolveRecouvrementFee(feeId, fees);
  if (!resolved) return null;

  const { fee, isPoolView } = resolved;
  const breakdownFeeId = isPoolView ? scolaritePoolFeeId(fees) : feeId;

  if (enrolled.length === 0) {
    const emptyStat: FeeBreakdownStat = {
      fee_id: breakdownFeeId,
      fee_name: fee.name,
      currency: fee.currency,
      total_expected: 0,
      total_collected: 0,
      total_remaining: 0,
      student_count: 0,
      ...(isPoolView ? { is_scolarite_pool: true } : {}),
    };
    return {
      activeYear: { id: activeYear.id, name: activeYear.name },
      schoolName: school.display_name ?? school.name,
      fee,
      feeStat: emptyStat,
      rows: [],
      classes,
      fees,
      filters,
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
    const raw = row as { student_id: string; fee_id: string; amount_paid: number };
    const key = `${raw.student_id}:${raw.fee_id}`;
    paidByStudentFee.set(
      key,
      (paidByStudentFee.get(key) ?? 0) + Number(raw.amount_paid),
    );
  }

  const feeStat =
    buildFeeBreakdown(fees, enrolled, paidByStudentFee).find(
      (s) => s.fee_id === breakdownFeeId,
    ) ?? {
      fee_id: breakdownFeeId,
      fee_name: fee.name,
      currency: fee.currency,
      total_expected: isPoolView
        ? fee.amount * enrolled.length
        : Number(fee.amount) * enrolled.length,
      total_collected: 0,
      total_remaining: 0,
      student_count: 0,
      ...(isPoolView ? { is_scolarite_pool: true } : {}),
    };

  let rows: RecouvrementStudentRow[] = [];

  for (const student of enrolled) {
    if (isPoolView) {
      const summary = scolaritePoolSummaryForStudent(
        student.id,
        fees,
        paidByStudentFee,
      );
      if (!summary) continue;
      rows.push({
        student_id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        matricule: student.matricule,
        class_id: student.class_id,
        class_name: student.class_name,
        class_level: student.class_level,
        amount_remaining: summary.total_remaining,
        currency: summary.currency,
      });
      continue;
    }

    const balances = studentDisplayBalances(
      student.id,
      fees,
      paidByStudentFee,
    );
    const line = balances.find((b) => b.fee_id === feeId);
    if (!line) continue;

    rows.push({
      student_id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      matricule: student.matricule,
      class_id: student.class_id,
      class_name: student.class_name,
      class_level: student.class_level,
      amount_remaining: line.amount_remaining,
      currency: line.currency,
    });
  }

  rows.sort((a, b) => {
    const byLast = a.last_name.localeCompare(b.last_name, 'fr');
    if (byLast !== 0) return byLast;
    return a.first_name.localeCompare(b.first_name, 'fr');
  });

  const search = filters.search?.toLowerCase() ?? '';
  if (search) {
    rows = rows.filter((r) =>
      matchesSearch(
        {
          id: r.student_id,
          first_name: r.first_name,
          last_name: r.last_name,
          matricule: r.matricule,
          class_id: r.class_id,
          class_name: r.class_name,
          class_level: r.class_level,
        },
        search,
      ),
    );
  }

  if (filters.classId) {
    rows = rows.filter((r) => r.class_id === filters.classId);
  }

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    schoolName: school.display_name ?? school.name,
    fee,
    feeStat,
    rows,
    classes,
    fees,
    filters,
  };
}

export const getImpayesRecouvrementPageData = cache(fetchImpayesRecouvrementPageData);
