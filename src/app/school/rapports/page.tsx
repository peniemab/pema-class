import { RapportsHub } from '@/components/school/rapports/rapports-hub';
import { loadRapportsHubPreview } from '@/lib/school/report-actions';

export default async function SchoolRapportsPage() {
  const preview = await loadRapportsHubPreview();
  return <RapportsHub preview={preview} />;
}
