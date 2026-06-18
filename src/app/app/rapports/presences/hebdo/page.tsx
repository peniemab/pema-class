import { WeeklyPresencesReportView } from '@/components/school/rapports/weekly-presences-report-view';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadWeeklyAttendanceReport } from '@/lib/school/report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AppWeeklyPresencesReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const reportData = await loadWeeklyAttendanceReport(params);
  return (
    <WeeklyPresencesReportView
      data={reportData}
      reportsBase={APP_REPORTS_BASE}
    />
  );
}
