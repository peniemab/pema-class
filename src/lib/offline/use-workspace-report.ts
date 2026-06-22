'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getOfflineDb, metaKey } from '@/lib/offline/db';
import { useAppData } from '@/lib/offline/app-data-context';

type WorkspacePayload<T> = {
  view: string;
  data: T;
  search?: string;
};

type Options<T> = {
  schoolId: string;
  metaScope: string;
  workspaceHref: string;
  view: string;
  buildLocal: () => T | null;
  deps?: unknown[];
};

/** Données locales → cache Dexie → sync workspace (pattern instantané). */
export function useWorkspaceReportData<T>({
  schoolId,
  metaScope,
  workspaceHref,
  view,
  buildLocal,
  deps = [],
}: Options<T>): T | null {
  const appData = useAppData();

  const localData = useMemo(
    () => buildLocal(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps contrôlées par l'appelant
    [appData, ...deps],
  );

  const cacheKey = metaKey(schoolId, metaScope);
  const cached = useLiveQuery(
    () => getOfflineDb().meta.get(cacheKey),
    [cacheKey],
  );
  const [fresh, setFresh] = useState<T | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/sync/workspace?href=${encodeURIComponent(workspaceHref.split('#')[0])}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then((res) =>
        res.ok ? (res.json() as Promise<WorkspacePayload<T>>) : null,
      )
      .then((payload) => {
        if (!alive || !payload || payload.view !== view) return;
        setFresh(payload.data);
        void getOfflineDb().meta.put({
          key: cacheKey,
          school_id: schoolId,
          scope: metaScope,
          value: payload.data,
          updated_at: new Date().toISOString(),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [schoolId, cacheKey, workspaceHref, view]);

  return (
    localData ??
    fresh ??
    (cached?.value as T | undefined) ??
    null
  );
}

export function parseHrefParams(href: string): URLSearchParams {
  return new URLSearchParams(href.split('?')[1] ?? '');
}
