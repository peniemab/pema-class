import { ImpayesListeReportView } from '@/components/school/rapports/impayes-liste-report-view';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadImpayesReport } from '@/lib/school/report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AppImpayesListeReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const reportData = await loadImpayesReport(params);
  return (
    <ImpayesListeReportView
      data={reportData}
      search={params.q}
      reportsBase={APP_REPORTS_BASE}
    />
  );
}
