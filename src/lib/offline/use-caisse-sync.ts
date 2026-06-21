'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { countPendingOutbox } from '@/lib/offline/outbox-repo';
import { pushOutbox } from '@/lib/offline/push-outbox';
import {
  readCaisseSyncState,
  saveCaisseSnapshot,
  type CaisseSyncState,
} from '@/lib/offline/caisse-repo';
import {
  type RefreshOptions,
  type SyncPhase,
  scheduleBackgroundWork,
} from '@/lib/offline/silent-sync';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';

export type CaisseSyncResult = {
  state: CaisseSyncState | null | undefined;
  phase: SyncPhase;
  online: boolean;
  pendingCount: number;
  refresh: (options?: RefreshOptions) => void;
};

async function pullCaisseSnapshot(): Promise<void> {
  const res = await fetch('/api/sync/caisse', {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`Sync HTTP ${res.status}`);
  const snapshot = (await res.json()) as CaisseSnapshot;
  await saveCaisseSnapshot(snapshot);
}

/** Pull caisse + push outbox — sync silencieuse si le cache Dexie existe déjà. */
export function useCaisseSync(schoolId: string): CaisseSyncResult {
  const [phase, setPhase] = useState<SyncPhase>('idle');
  const [online, setOnline] = useState(true);
  const syncInFlightRef = useRef(false);

  const state = useLiveQuery(() => readCaisseSyncState(schoolId), [schoolId]);
  const pendingCount = useLiveQuery(
    () => countPendingOutbox(schoolId),
    [schoolId],
  );

  const hasLocalCache = useMemo(
    () => Boolean(state?.lastSyncAt),
    [state?.lastSyncAt],
  );

  const refresh = useCallback(
    (options?: RefreshOptions) => {
      const visible = options?.visible === true;

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (!hasLocalCache) setPhase('error');
        return;
      }

      if (syncInFlightRef.current) return;
      syncInFlightRef.current = true;

      if (visible) setPhase('syncing');

      pushOutbox(schoolId)
        .then(() => pullCaisseSnapshot())
        .then(() => setPhase('idle'))
        .catch(() => {
          if (!hasLocalCache || visible) setPhase('error');
        })
        .finally(() => {
          syncInFlightRef.current = false;
        });
    },
    [schoolId, hasLocalCache],
  );

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      scheduleBackgroundWork(() => refresh());
    };
    const goOffline = () => {
      setOnline(false);
      if (hasLocalCache) setPhase('idle');
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [refresh, hasLocalCache]);

  useEffect(() => {
    const cancel = scheduleBackgroundWork(() => refresh());
    return cancel;
  }, [refresh]);

  return {
    state,
    phase,
    online,
    pendingCount: pendingCount ?? 0,
    refresh,
  };
}
