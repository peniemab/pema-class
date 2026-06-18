'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { countPendingOutbox } from '@/lib/offline/outbox-repo';
import { pushOutbox } from '@/lib/offline/push-outbox';
import {
  readCaisseSyncState,
  saveCaisseSnapshot,
  type CaisseSyncState,
} from '@/lib/offline/caisse-repo';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import type { SyncPhase } from '@/lib/offline/use-students-sync';

export type CaisseSyncResult = {
  state: CaisseSyncState | null | undefined;
  phase: SyncPhase;
  online: boolean;
  pendingCount: number;
  refresh: () => void;
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

/** Pull caisse + push outbox (encaissements et inscriptions en attente). */
export function useCaisseSync(schoolId: string): CaisseSyncResult {
  const [phase, setPhase] = useState<SyncPhase>('idle');
  const [online, setOnline] = useState(true);

  const state = useLiveQuery(() => readCaisseSyncState(schoolId), [schoolId]);
  const pendingCount = useLiveQuery(
    () => countPendingOutbox(schoolId),
    [schoolId],
  );

  const refresh = useCallback(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setPhase('error');
      return;
    }
    setPhase('syncing');
    pushOutbox(schoolId)
      .then(() => pullCaisseSnapshot())
      .then(() => setPhase('idle'))
      .catch(() => setPhase('error'));
  }, [schoolId]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      refresh();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    state,
    phase,
    online,
    pendingCount: pendingCount ?? 0,
    refresh,
  };
}
