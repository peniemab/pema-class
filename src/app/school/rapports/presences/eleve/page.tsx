import { StudentHistoryReportView } from '@/components/school/rapports/student-history-report-view';
import { loadStudentAttendanceHistory } from '@/lib/school/attendance-report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function StudentHistoryReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadStudentAttendanceHistory(params);
  return <StudentHistoryReportView data={data} />;
}
