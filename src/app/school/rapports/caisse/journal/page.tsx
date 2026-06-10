import { CashJournalReportView } from '@/components/school/rapports/cash-journal-report-view';
import { loadCashJournalReport } from '@/lib/school/report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CashJournalReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadCashJournalReport(params);
  return <CashJournalReportView data={data} />;
}
