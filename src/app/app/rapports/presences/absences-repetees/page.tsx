import { RepeatedAbsencesReportView } from '@/components/school/rapports/repeated-absences-report-view';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadRepeatedAbsencesReport } from '@/lib/school/report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AppRepeatedAbsencesReportPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const reportData = await loadRepeatedAbsencesReport(params);
  return (
    <RepeatedAbsencesReportView
      data={reportData}
      reportsBase={APP_REPORTS_BASE}
    />
  );
}
