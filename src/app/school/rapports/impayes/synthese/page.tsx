import { ImpayesSyntheseReportView } from '@/components/school/rapports/impayes-synthese-report-view';
import { loadImpayesReport } from '@/lib/school/report-actions';

export default async function ImpayesSyntheseReportPage() {
  const data = await loadImpayesReport({});
  return <ImpayesSyntheseReportView data={data} />;
}
