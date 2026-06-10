import { WeeklyPresencesReportView } from '@/components/school/rapports/weekly-presences-report-view';
import { loadWeeklyAttendanceReport } from '@/lib/school/attendance-report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function WeeklyPresencesReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadWeeklyAttendanceReport(params);
  return <WeeklyPresencesReportView data={data} />;
}
