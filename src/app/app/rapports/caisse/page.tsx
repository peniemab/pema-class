import { CaisseReportsHub } from '@/components/school/rapports/caisse-reports-hub';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';

export default function AppCaisseReportsPage() {
  return <CaisseReportsHub reportsBase={APP_REPORTS_BASE} />;
}
