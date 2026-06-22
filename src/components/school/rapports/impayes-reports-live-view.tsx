'use client';

import { ImpayesSyntheseReportView } from '@/components/school/rapports/impayes-synthese-report-view';
import { ImpayesListeReportView } from '@/components/school/rapports/impayes-liste-report-view';
import type { ImpayesReportData } from '@/lib/db/finance-reports';
import { useAppData } from '@/lib/offline/app-data-context';
import { buildImpayesReportFromAppData } from '@/lib/offline/impayes-local';
import {
  parseHrefParams,
  useWorkspaceReportData,
} from '@/lib/offline/use-workspace-report';
import { cn } from '@/lib/utils';

function ReportSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4 p-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-wa-divider/80" />
      <div className="h-4 w-64 animate-pulse rounded-md bg-wa-divider/80" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('h-16 animate-pulse rounded-lg bg-wa-divider/80')} />
        ))}
      </div>
    </div>
  );
}

type Props = {
  schoolId: string;
};

export function ImpayesSyntheseLiveView({ schoolId }: Props) {
  const appData = useAppData();
  const data = useWorkspaceReportData<ImpayesReportData>({
    schoolId,
    metaScope: 'school-impayes-synthese',
    workspaceHref: '/school/rapports/impayes/synthese',
    view: 'impayes-synthese',
    buildLocal: () => buildImpayesReportFromAppData(appData),
  });

  if (!data) return <ReportSkeleton />;
  return <ImpayesSyntheseReportView data={data} />;
}

type ListeProps = Props & { href: string };

export function ImpayesListeLiveView({ schoolId, href }: ListeProps) {
  const appData = useAppData();
  const params = parseHrefParams(href);
  const search = params.get('q') ?? undefined;
  const classId = params.get('classe') ?? undefined;
  const feeId = params.get('frais') ?? undefined;

  const data = useWorkspaceReportData<ImpayesReportData>({
    schoolId,
    metaScope: `school-impayes-liste:${params.toString()}`,
    workspaceHref: href,
    view: 'impayes-liste',
    buildLocal: () =>
      buildImpayesReportFromAppData(appData, { search, classId, feeId }),
    deps: [search, classId, feeId],
  });

  if (!data) return <ReportSkeleton />;
  return <ImpayesListeReportView data={data} search={search} />;
}
