import { PresencesReportPageView } from '@/components/school/rapports/presences-report-page-view';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadAttendanceReport } from '@/lib/school/report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AppDailyPresencesReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const reportData = await loadAttendanceReport(params);
  return (
    <PresencesReportPageView
      data={reportData}
      reportsBase={APP_REPORTS_BASE}
    />
  );
}
