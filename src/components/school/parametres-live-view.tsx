'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { ParametresScreen } from '@/components/school/parametres-screen';
import type { DashboardPageData } from '@/lib/db/dashboard-page';
import { getOfflineDb, metaKey } from '@/lib/offline/db';
import { useAppData } from '@/lib/offline/app-data-context';
import {
  buildParametresPartialFromAppData,
  type ParametresBundle,
} from '@/lib/offline/parametres-local';
import { PARAMETRES_META_SCOPE } from '@/lib/offline/prefetch-parametres';
import { useWorkspaceReportData } from '@/lib/offline/use-workspace-report';
import { cn } from '@/lib/utils';

const DASHBOARD_SCOPE = 'school-dashboard';

function ParametresSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement des paramètres" className="pb-8">
      <div className="space-y-2 px-4 pt-4">
        <div className="h-7 w-36 animate-pulse rounded-md bg-wa-divider/80" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-wa-divider/80" />
      </div>
      <div className="mt-4 space-y-0 border-y border-wa-divider">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
            <div className={cn('size-10 animate-pulse rounded-full bg-wa-divider/80')} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-wa-divider/80" />
              <div className="h-3 w-48 animate-pulse rounded bg-wa-divider/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  schoolId: string;
};

export function ParametresLiveView({ schoolId }: Props) {
  const appData = useAppData();

  const dashboardMeta = useLiveQuery(
    () => getOfflineDb().meta.get(metaKey(schoolId, DASHBOARD_SCOPE)),
    [schoolId],
  );
  const schoolName =
    (dashboardMeta?.value as DashboardPageData | undefined)?.schoolName ?? '';

  const data = useWorkspaceReportData<ParametresBundle>({
    schoolId,
    metaScope: PARAMETRES_META_SCOPE,
    workspaceHref: '/school/parametres',
    view: 'parametres',
    buildLocal: () => buildParametresPartialFromAppData(appData, schoolName),
    localFirst: false,
  });

  if (!data) return <ParametresSkeleton />;

  return (
    <ParametresScreen
      school={data.school}
      referentials={data.referentials}
      team={data.team}
    />
  );
}
