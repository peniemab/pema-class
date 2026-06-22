'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImpayesSyntheseReportView } from '@/components/school/rapports/impayes-synthese-report-view';
import { ImpayesListeReportView } from '@/components/school/rapports/impayes-liste-report-view';
import type { ImpayesReportData } from '@/lib/db/finance-reports';
import {
  buildWorkspaceHref,
  reportsBaseForHref,
} from '@/lib/navigation/workspace-route-utils';
import { reportHref } from '@/lib/navigation/reports-paths';
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
  href: string;
};

export function ImpayesSyntheseLiveView({ schoolId, href }: Props) {
  const appData = useAppData();
  const reportsBase = reportsBaseForHref(href);
  const workspaceHref = reportHref(reportsBase, 'impayes', 'synthese');

  const data = useWorkspaceReportData<ImpayesReportData>({
    schoolId,
    metaScope: 'school-impayes-synthese',
    workspaceHref,
    view: 'impayes-synthese',
    buildLocal: () => buildImpayesReportFromAppData(appData),
  });

  if (!data) return <ReportSkeleton />;
  return <ImpayesSyntheseReportView data={data} reportsBase={reportsBase} />;
}

type ListeFilters = {
  search?: string;
  classId?: string;
  feeId?: string;
};

function parseListeFilters(href: string): ListeFilters {
  const params = parseHrefParams(href);
  return {
    search: params.get('q') ?? undefined,
    classId: params.get('classe') ?? undefined,
    feeId: params.get('frais') ?? undefined,
  };
}

export function ImpayesListeLiveView({ schoolId, href }: Props) {
  const appData = useAppData();
  const reportsBase = reportsBaseForHref(href);
  const basePath = reportHref(reportsBase, 'impayes', 'liste');

  const [filters, setFilters] = useState<ListeFilters>(() => parseListeFilters(href));

  useEffect(() => {
    setFilters(parseListeFilters(href));
  }, [href]);

  const workspaceHref = useMemo(
    () =>
      buildWorkspaceHref(basePath, {
        q: filters.search,
        classe: filters.classId,
        frais: filters.feeId,
      }),
    [basePath, filters],
  );

  const data = useWorkspaceReportData<ImpayesReportData>({
    schoolId,
    metaScope: `school-impayes-liste:${JSON.stringify(filters)}`,
    workspaceHref,
    view: 'impayes-liste',
    buildLocal: () => buildImpayesReportFromAppData(appData, filters),
    deps: [filters.search, filters.classId, filters.feeId],
  });

  const handleFiltersChange = useCallback(
    (params: { q?: string; classe?: string; frais?: string }) => {
      setFilters((prev) => ({
        search: params.q !== undefined ? params.q : prev.search,
        classId: params.classe !== undefined ? params.classe : prev.classId,
        feeId: params.frais !== undefined ? params.frais : prev.feeId,
        ...(params.q === undefined &&
        params.classe === undefined &&
        params.frais === undefined
          ? { search: undefined, classId: undefined, feeId: undefined }
          : {}),
      }));
    },
    [],
  );

  if (!data) return <ReportSkeleton />;

  return (
    <ImpayesListeReportView
      data={data}
      search={filters.search}
      reportsBase={reportsBase}
      onFiltersChange={handleFiltersChange}
    />
  );
}
