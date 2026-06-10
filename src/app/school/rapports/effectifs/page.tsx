import { EnrollmentReportView } from '@/components/school/rapports/enrollment-report-view';
import { loadEnrollmentReport } from '@/lib/school/report-actions';

export default async function EffectifsReportPage() {
  const data = await loadEnrollmentReport();
  return <EnrollmentReportView data={data} />;
}
