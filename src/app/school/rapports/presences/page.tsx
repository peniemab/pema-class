import { PresencesReportsHub } from '@/components/school/rapports/presences-reports-hub';
import { loadAttendanceReport } from '@/lib/school/attendance-report-actions';

export default async function PresencesReportsHubPage() {
  const todayPreview = await loadAttendanceReport({});
  return <PresencesReportsHub todayPreview={todayPreview} />;
}
