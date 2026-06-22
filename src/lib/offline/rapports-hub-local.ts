import type { RapportsHubPreview } from '@/lib/db/finance-reports';
import type { AppDataValue } from '@/lib/offline/app-data-context';
import { buildAttendanceReportFromAppData } from '@/lib/offline/attendance-report-local';
import { buildCashJournalFromAppData } from '@/lib/offline/cash-journal-local';
import { buildEnrollmentFromAppData } from '@/lib/offline/enrollment-local';
import { buildImpayesFromAppData } from '@/lib/offline/impayes-local';
import { getSchoolFeeCurrencies } from '@/lib/school/fee-currencies';
import { todayIsoDate } from '@/lib/date-utils';

export type RapportsHubLivePreview = RapportsHubPreview & {
  presencesIssues: number | null;
};

/** Aperçu hub rapports depuis AppData (affichage instantané). */
export function buildRapportsHubPreviewFromAppData(
  data: AppDataValue,
): RapportsHubLivePreview {
  const today = todayIsoDate();
  const cash = buildCashJournalFromAppData(data, today);
  const impayes = buildImpayesFromAppData(data);
  const enrollment = buildEnrollmentFromAppData(data);
  const presences = buildAttendanceReportFromAppData(data, { date: today });

  const issues = presences
    ? presences.totals.absent +
      presences.totals.late +
      presences.totals.unmarked
    : null;

  return {
    feeCurrencies: cash?.feeCurrencies ?? getSchoolFeeCurrencies(impayes?.fees ?? []),
    cashTodayCdf: cash?.totals.cdf ?? null,
    cashTodayUsd: cash?.totals.usd ?? null,
    cashTodayCount: cash?.totals.count ?? null,
    studentsWithDebt: impayes?.stats?.studentsWithDebt ?? null,
    totalEnrolled: enrollment?.totals.enrolled ?? null,
    presencesIssues: issues,
  };
}
