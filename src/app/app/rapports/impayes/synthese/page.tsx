import { ImpayesSyntheseReportView } from '@/components/school/rapports/impayes-synthese-report-view';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadImpayesReport } from '@/lib/school/report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AppImpayesSyntheseReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const reportData = await loadImpayesReport(params);
  return (
    <ImpayesSyntheseReportView
      data={reportData}
      reportsBase={APP_REPORTS_BASE}
    />
  );
}
