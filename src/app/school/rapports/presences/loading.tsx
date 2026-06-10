import { SettingsLargeTitle } from '@/components/school/settings-panel';

export default function PresencesReportsHubLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <SettingsLargeTitle title="Rapports présences" subtitle="Chargement…" />
      <div className="h-48 animate-pulse rounded-xl border bg-muted/30" />
    </div>
  );
}
