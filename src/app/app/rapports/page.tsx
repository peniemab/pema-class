import { RapportsHub } from '@/components/school/rapports/rapports-hub';
import { APP_REPORTS_BASE } from '@/lib/navigation/reports-paths';
import { loadRapportsHubPreview } from '@/lib/school/report-actions';

export default async function AppRapportsPage() {
  const preview = await loadRapportsHubPreview();
  return <RapportsHub preview={preview} reportsBase={APP_REPORTS_BASE} />;
}
