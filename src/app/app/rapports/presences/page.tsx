import { PresencesReportsHub } from '@/components/school/rapports/presences-reports-hub';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadAttendanceReport } from '@/lib/school/report-actions';

export default async function AppPresencesReportsPage() {
  const todayPreview = await loadAttendanceReport({});
  return (
    <PresencesReportsHub
      todayPreview={todayPreview}
      reportsBase={APP_REPORTS_BASE}
    />
  );
}
