import { CashJournalReportView } from '@/components/school/rapports/cash-journal-report-view';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadCashJournalReport } from '@/lib/school/report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AppCashJournalReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const reportData = await loadCashJournalReport(params);
  return (
    <CashJournalReportView
      data={reportData}
      reportsBase={APP_REPORTS_BASE}
    />
  );
}
