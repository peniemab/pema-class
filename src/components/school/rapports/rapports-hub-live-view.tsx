'use client';

import { RapportsHub } from '@/components/school/rapports/rapports-hub';
import { useAppData } from '@/lib/offline/app-data-context';
import {
  buildRapportsHubPreviewFromAppData,
  type RapportsHubLivePreview,
} from '@/lib/offline/rapports-hub-local';
import { reportsBaseForHref } from '@/lib/navigation/workspace-route-utils';
import { useWorkspaceReportData } from '@/lib/offline/use-workspace-report';
import { cn } from '@/lib/utils';

function HubSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4 p-4">
      <div className="h-8 w-32 animate-pulse rounded-md bg-wa-divider/80" />
      <div className="h-4 w-56 animate-pulse rounded-md bg-wa-divider/80" />
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn('h-16 animate-pulse rounded-xl bg-wa-divider/80')}
        />
      ))}
    </div>
  );
}

type Props = {
  schoolId: string;
  href?: string;
};

export function RapportsHubLiveView({ schoolId, href = '/school/rapports' }: Props) {
  const appData = useAppData();
  const data = useWorkspaceReportData<RapportsHubLivePreview>({
    schoolId,
    metaScope: 'school-rapports-hub',
    workspaceHref: href.split('#')[0],
    view: 'rapports-hub',
    buildLocal: () => buildRapportsHubPreviewFromAppData(appData),
  });

  if (!data) return <HubSkeleton />;
  return <RapportsHub preview={data} reportsBase={reportsBaseForHref(href)} />;
}
