import { WorkspaceLink } from '@/components/school/mobile/workspace-link';
import { ChevronRight, BarChart3, List } from 'lucide-react';
import {
  SettingsIcon,
  SettingsLargeTitle,
  SettingsPanelGroup,
} from '@/components/school/settings-panel';

import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  reportsBase?: string;
};

export function ImpayesReportsHub({
  reportsBase = SCHOOL_REPORTS_BASE,
}: Props = {}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <SettingsLargeTitle
        title="Rapports impayés"
        subtitle="Recouvrement et soldes dus"
      />

      <SettingsPanelGroup>
        <WorkspaceLink
          href={reportHref(reportsBase, 'impayes', 'synthese')}
          className="flex w-full min-h-[4.25rem] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted/70"
        >
          <SettingsIcon tone="orange">
            <BarChart3 aria-hidden />
          </SettingsIcon>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-medium">Synthèse</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              KPIs et répartition par frais
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
        </WorkspaceLink>
        <WorkspaceLink
          href={reportHref(reportsBase, 'impayes', 'liste')}
          className="flex w-full min-h-[4.25rem] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted/70"
        >
          <SettingsIcon tone="pink">
            <List aria-hidden />
          </SettingsIcon>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-medium">Liste impayés</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Élèves avec reste à payer, filtres classe/frais
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
        </WorkspaceLink>
      </SettingsPanelGroup>
    </div>
  );
}
