import { SettingsLargeTitle } from '@/components/school/settings-panel';

export default function RapportsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <SettingsLargeTitle title="Rapports" subtitle="Chargement…" />
      <div className="h-20 animate-pulse rounded-xl border bg-muted/30" />
    </div>
  );
}
