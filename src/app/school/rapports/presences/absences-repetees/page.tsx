import { RepeatedAbsencesReportView } from '@/components/school/rapports/repeated-absences-report-view';
import { loadRepeatedAbsencesReport } from '@/lib/school/attendance-report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function RepeatedAbsencesReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadRepeatedAbsencesReport(params);
  return <RepeatedAbsencesReportView data={data} />;
}
