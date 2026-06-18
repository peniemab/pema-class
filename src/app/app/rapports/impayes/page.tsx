import { ImpayesReportsHub } from '@/components/school/rapports/impayes-reports-hub';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';

export default function AppImpayesReportsPage() {
  return <ImpayesReportsHub reportsBase={APP_REPORTS_BASE} />;
}
