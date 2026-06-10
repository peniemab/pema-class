import { PresencesReportPageView } from '@/components/school/rapports/presences-report-page-view';
import { loadAttendanceReport } from '@/lib/school/attendance-report-actions';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function DailyPresencesReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const reportData = await loadAttendanceReport(params);
  return <PresencesReportPageView data={reportData} />;
}
