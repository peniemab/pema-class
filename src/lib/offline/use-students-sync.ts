'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getOfflineDb } from '@/lib/offline/db';
import {
  readStudentsSyncState,
  saveStudentsSnapshot,
  type StudentsSyncState,
} from '@/lib/offline/students-repo';
import { countPendingOutbox } from '@/lib/offline/outbox-repo';
import { pushOutbox } from '@/lib/offline/push-outbox';
import {
  type RefreshOptions,
  type SyncPhase,
  scheduleBackgroundWork,
} from '@/lib/offline/silent-sync';
import type { LocalStudent, LocalClass } from '@/lib/offline/db';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';

export type { SyncPhase };

export type StudentsSyncResult = {
  students: LocalStudent[] | undefined;
  classes: LocalClass[] | undefined;
  state: StudentsSyncState | null | undefined;
  phase: SyncPhase;
  online: boolean;
  pendingCount: number;
  refresh: (options?: RefreshOptions) => void;
};

async function pullSnapshot(): Promise<void> {
  const res = await fetch('/api/sync/students', {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`Sync HTTP ${res.status}`);
  const snapshot = (await res.json()) as StudentsSnapshot;
  await saveStudentsSnapshot(snapshot);
}

/**
 * Lecture locale instantanée (Dexie) + sync cloud silencieuse en arrière-plan.
 * L’UI ne passe en « Synchronisation… » que sur refresh manuel (badge).
 */
export function useStudentsSync(schoolId: string): StudentsSyncResult {
  const [phase, setPhase] = useState<SyncPhase>('idle');
  const [online, setOnline] = useState(true);
  const syncInFlightRef = useRef(false);

  const students = useLiveQuery(
    () => getOfflineDb().students.where('school_id').equals(schoolId).toArray(),
    [schoolId],
  );
  const classes = useLiveQuery(
    () => getOfflineDb().classes.where('school_id').equals(schoolId).toArray(),
    [schoolId],
  );
  const state = useLiveQuery(() => readStudentsSyncState(schoolId), [schoolId]);
  const pendingCount = useLiveQuery(
    () => countPendingOutbox(schoolId),
    [schoolId],
  );

  const hasLocalCache = useMemo(
    () => Boolean(state?.lastSyncAt) || (students?.length ?? 0) > 0,
    [state?.lastSyncAt, students?.length],
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
        .then(() => pullSnapshot())
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
    students,
    classes,
    state,
    phase,
    online,
    pendingCount: pendingCount ?? 0,
    refresh,
  };
}
