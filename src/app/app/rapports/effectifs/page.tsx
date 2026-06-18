import { EnrollmentReportView } from '@/components/school/rapports/enrollment-report-view';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadEnrollmentReport } from '@/lib/school/report-actions';

export default async function AppEnrollmentReportPage() {
  const reportData = await loadEnrollmentReport();
  return (
    <EnrollmentReportView
      data={reportData}
      reportsBase={APP_REPORTS_BASE}
    />
  );
}
