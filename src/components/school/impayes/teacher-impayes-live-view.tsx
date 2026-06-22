'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TeacherImpayesView } from '@/components/school/impayes/teacher-impayes-view';
import type { TeacherImpayesPageData } from '@/lib/db/teacher-impayes-page';
import type { FeeCurrency } from '@/lib/school/fee-currencies';
import { buildWorkspaceHref } from '@/lib/navigation/workspace-route-utils';
import { getOfflineDb, metaKey } from '@/lib/offline/db';

type Payload = {
  view: 'teacher-impayes';
  data: TeacherImpayesPageData;
  feeCurrencies: FeeCurrency[];
};

type FilterState = {
  q?: string;
  classe?: string;
};

function parseFilters(href: string): FilterState {
  const params = new URL(href, 'http://local').searchParams;
  return {
    q: params.get('q') ?? undefined,
    classe: params.get('classe') ?? undefined,
  };
}

function ReportSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4 p-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-wa-divider/80" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-wa-divider/80" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-wa-divider/80" />
        ))}
      </div>
    </div>
  );
}

type Props = {
  schoolId: string;
  href: string;
};

/** Recouvrement enseignant — overlay /app sans navigation Next.js. */
export function TeacherImpayesLiveView({ schoolId, href }: Props) {
  const [filters, setFilters] = useState<FilterState>(() => parseFilters(href));
  const workspaceHref = buildWorkspaceHref('/app/impayes', filters);

  useEffect(() => {
    setFilters(parseFilters(href));
  }, [href]);

  const cacheKey = metaKey(schoolId, 'teacher-impayes');
  const cached = useLiveQuery(
    () => getOfflineDb().meta.get(cacheKey),
    [cacheKey],
  );
  const [fresh, setFresh] = useState<Payload | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(
      `/api/sync/workspace?href=${encodeURIComponent(workspaceHref.split('#')[0])}`,
      { cache: 'no-store', credentials: 'same-origin' },
    )
      .then((res) => (res.ok ? (res.json() as Promise<Payload>) : null))
      .then((payload) => {
        if (!alive || !payload || payload.view !== 'teacher-impayes') return;
        setFresh(payload);
        void getOfflineDb().meta.put({
          key: cacheKey,
          school_id: schoolId,
          scope: 'teacher-impayes',
          value: payload,
          updated_at: new Date().toISOString(),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [workspaceHref, cacheKey, schoolId]);

  const handleFiltersChange = useCallback(
    (patch: Record<string, string | undefined>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        for (const [key, value] of Object.entries(patch)) {
          if (!value) delete next[key as keyof FilterState];
        }
        return next;
      });
    },
    [],
  );

  const payload = fresh ?? (cached?.value as Payload | undefined);
  if (!payload) return <ReportSkeleton />;

  return (
    <TeacherImpayesView
      data={payload.data}
      feeCurrencies={payload.feeCurrencies}
      onFiltersChange={handleFiltersChange}
    />
  );
}
