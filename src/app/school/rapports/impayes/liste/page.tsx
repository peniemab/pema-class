import { ImpayesListeReportView } from '@/components/school/rapports/impayes-liste-report-view';
import { loadImpayesReport } from '@/lib/school/report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ImpayesListeReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadImpayesReport(params);
  return <ImpayesListeReportView data={data} search={params.q} />;
}
