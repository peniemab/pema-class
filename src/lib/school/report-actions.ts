'use server';

import { getAttendanceReportData } from '@/lib/db/attendance-reports';
import {
  getCashJournalReport,
  getEnrollmentReport,
  getImpayesReportData,
  getRapportsHubPreview,
} from '@/lib/db/finance-reports';
import {
  getRepeatedAbsencesReport,
  getStudentAttendanceHistory,
  getWeeklyAttendanceReport,
} from '@/lib/db/attendance-reports-ext';
import { requireSchoolDirection } from '@/lib/auth/require-role';

export async function loadAttendanceReport(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId } = await requireSchoolDirection();
  return getAttendanceReportData(schoolId, searchParams);
}

export async function loadWeeklyAttendanceReport(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId } = await requireSchoolDirection();
  return getWeeklyAttendanceReport(schoolId, searchParams);
}

export async function loadRepeatedAbsencesReport(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId } = await requireSchoolDirection();
  return getRepeatedAbsencesReport(schoolId, searchParams);
}

export async function loadStudentAttendanceHistory(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId } = await requireSchoolDirection();
  return getStudentAttendanceHistory(schoolId, searchParams);
}

export async function loadCashJournalReport(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId } = await requireSchoolDirection();
  return getCashJournalReport(schoolId, searchParams);
}

export async function loadImpayesReport(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId } = await requireSchoolDirection();
  return getImpayesReportData(schoolId, searchParams);
}

export async function loadEnrollmentReport() {
  const { schoolId } = await requireSchoolDirection();
  return getEnrollmentReport(schoolId);
}

export async function loadRapportsHubPreview() {
  const { schoolId } = await requireSchoolDirection();
  const [preview, todayPresences] = await Promise.all([
    getRapportsHubPreview(schoolId),
    getAttendanceReportData(schoolId, {}),
  ]);

  const issues = todayPresences
    ? todayPresences.totals.absent +
      todayPresences.totals.late +
      todayPresences.totals.unmarked
    : null;

  return { ...preview, presencesIssues: issues };
}
