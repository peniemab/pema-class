'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { RecouvrementFilters } from '@/components/school/impayes/recouvrement-filters';
import { RecouvrementPrintButton } from '@/components/school/impayes/recouvrement-print-button';
import { RecouvrementTable } from '@/components/school/impayes/recouvrement-table';
import { WorkspaceLink } from '@/components/school/mobile/workspace-link';
import { getOfflineDb, metaKey } from '@/lib/offline/db';
import type { DashboardPageData } from '@/lib/db/dashboard-page';
import type { ImpayesRecouvrementPageData } from '@/lib/db/impayes-page';
import { useAppData } from '@/lib/offline/app-data-context';
import { buildRecouvrementFromAppData } from '@/lib/offline/impayes-local';
import { recouvrementCacheKey } from '@/lib/offline/prefetch-recouvrement';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import { cn } from '@/lib/utils';

const DASHBOARD_SCOPE = 'school-dashboard';

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-wa-divider/80', className)}
      aria-hidden
    />
  );
}

function RecouvrementSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6 p-4">
      <Bone className="h-8 w-48" />
      <Bone className="h-4 w-64" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Bone key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <Bone className="h-64 rounded-lg" />
    </div>
  );
}

type Props = {
  schoolId: string;
  feeId: string;
  search?: string;
  classId?: string;
  onBack?: () => void;
  /** Changement de frais depuis les filtres (stack interne). */
  onFeeChange?: (feeId: string) => void;
};

export function RecouvrementLiveView({
  schoolId,
  feeId: initialFeeId,
  search: initialSearch,
  classId: initialClassId,
  onBack,
  onFeeChange,
}: Props) {
  const appData = useAppData();
  const [feeId, setFeeId] = useState(initialFeeId);
  const [search, setSearch] = useState(initialSearch);
  const [classId, setClassId] = useState(initialClassId);

  useEffect(() => {
    setFeeId(initialFeeId);
    setSearch(initialSearch);
    setClassId(initialClassId);
  }, [initialFeeId, initialSearch, initialClassId]);

  const dashboardMeta = useLiveQuery(
    () => getOfflineDb().meta.get(metaKey(schoolId, DASHBOARD_SCOPE)),
    [schoolId],
  );
  const schoolName =
    (dashboardMeta?.value as DashboardPageData | undefined)?.schoolName ?? '';

  const localData = useMemo(
    () =>
      buildRecouvrementFromAppData(appData, {
        feeId,
        search,
        classId,
        schoolName,
      }),
    [appData, feeId, search, classId, schoolName],
  );

  const cacheKey = recouvrementCacheKey(schoolId, feeId, search, classId);
  const cached = useLiveQuery(
    () => getOfflineDb().meta.get(cacheKey),
    [cacheKey],
  );
  const [fresh, setFresh] = useState<ImpayesRecouvrementPageData | null>(null);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ frais: feeId });
    if (search) params.set('q', search);
    if (classId) params.set('classe', classId);

    fetch(`/api/sync/impayes/recouvrement?${params}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then((res) =>
        res.ok ? (res.json() as Promise<ImpayesRecouvrementPageData>) : null,
      )
      .then((data) => {
        if (!alive || !data) return;
        setFresh(data);
        void getOfflineDb().meta.put({
          key: cacheKey,
          school_id: schoolId,
          scope: 'impayes-recouvrement',
          value: data,
          updated_at: new Date().toISOString(),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [schoolId, feeId, search, classId, cacheKey]);

  const handleFiltersChange = useCallback(
    (params: { frais: string; q?: string; classe?: string }) => {
      setFeeId(params.frais);
      setSearch(params.q);
      setClassId(params.classe);
      onFeeChange?.(params.frais);
    },
    [onFeeChange],
  );

  const data =
    localData ??
    fresh ??
    (cached?.value as ImpayesRecouvrementPageData | undefined) ??
    null;

  if (!data) return <RecouvrementSkeleton />;

  const totalRemaining = data.rows.reduce((s, r) => s + r.amount_remaining, 0);
  const generatedAt = new Date().toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <div className="recouvrement-view mx-auto max-w-5xl space-y-6 p-4 pb-8">
      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted"
              aria-label="Retour aux impayés"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </button>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Recouvrement</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.fee.name} — Année {data.activeYear.name}
            </p>
          </div>
        </div>
        <RecouvrementPrintButton />
      </div>

      <div className="recouvrement-print-header hidden print:block">
        <h1 className="text-lg font-bold">Liste de recouvrement — {data.fee.name}</h1>
        <p className="text-sm text-black/70">
          {data.schoolName} · Année {data.activeYear.name} · {generatedAt}
        </p>
      </div>

      <div className="no-print grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">{data.rows.length}</p>
          <p className="text-xs text-muted-foreground">
            Élèves inscrits · {data.feeStat.student_count} impayé
            {data.feeStat.student_count > 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-lg font-semibold tabular-nums">
            {formatFeeAmount(data.feeStat.total_collected, data.fee.currency)}
            <span className="mx-1 font-normal text-muted-foreground">/</span>
            {formatFeeAmount(data.feeStat.total_expected, data.fee.currency)}
          </p>
          <p className="text-xs text-muted-foreground">Encaissé / attendu (tous inscrits)</p>
        </div>
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">
            {formatFeeAmount(totalRemaining, data.fee.currency)}
          </p>
          <p className="text-xs text-muted-foreground">Reste sur cette liste</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <RecouvrementFilters
          classes={data.classes}
          fees={data.fees}
          feeId={data.fee.id}
          filters={{
            search: data.filters.search,
            classId: data.filters.classId,
          }}
          onFiltersChange={handleFiltersChange}
        />
      </Suspense>

      <div className="recouvrement-print-area space-y-2">
        <p className="text-sm text-muted-foreground print:text-black/70">
          {data.rows.length} inscrit{data.rows.length > 1 ? 's' : ''}
          {data.feeStat.student_count > 0
            ? ` · ${data.feeStat.student_count} impayé${data.feeStat.student_count > 1 ? 's' : ''}`
            : ' · tous soldés'}
          {data.filters.classId ? ' · classe filtrée' : ''}
          {data.filters.search ? ` · recherche « ${data.filters.search} »` : ''}
        </p>
        <RecouvrementTable rows={data.rows} feeName={data.fee.name} />
      </div>

      <p className="no-print text-center text-xs text-muted-foreground">
        Cliquez sur un élève pour la fiche, ou{' '}
        <WorkspaceLink href="/school/caisse" className="text-primary underline">
          ouvrir la caisse
        </WorkspaceLink>{' '}
        pour encaisser.
      </p>
    </div>
  );
}
