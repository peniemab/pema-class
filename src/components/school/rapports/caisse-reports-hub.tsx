import Link from 'next/link';
import { ChevronRight, ClipboardList } from 'lucide-react';
import {
  SettingsIcon,
  SettingsLargeTitle,
  SettingsPanelGroup,
} from '@/components/school/settings-panel';

import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  reportsBase?: string;
};

export function CaisseReportsHub({
  reportsBase = SCHOOL_REPORTS_BASE,
}: Props = {}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <SettingsLargeTitle
        title="Rapports caisse"
        subtitle="Encaissements et journal comptable"
      />

      <SettingsPanelGroup>
        <Link
          href={reportHref(reportsBase, 'caisse', 'journal')}
          className="flex w-full min-h-[4.25rem] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted/70"
        >
          <SettingsIcon tone="indigo">
            <ClipboardList aria-hidden />
          </SettingsIcon>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-medium">Journal du jour</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Liste des encaissements par date
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
        </Link>
      </SettingsPanelGroup>
    </div>
  );
}
