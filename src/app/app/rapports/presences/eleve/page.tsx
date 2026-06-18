import { StudentHistoryReportView } from '@/components/school/rapports/student-history-report-view';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadStudentAttendanceHistory } from '@/lib/school/report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AppStudentHistoryReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const reportData = await loadStudentAttendanceHistory(params);
  return (
    <StudentHistoryReportView
      data={reportData}
      reportsBase={APP_REPORTS_BASE}
    />
  );
}
