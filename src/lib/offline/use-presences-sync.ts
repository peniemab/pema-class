'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getOfflineDb } from '@/lib/offline/db';
import type { AttendancePageData } from '@/lib/db/attendance-page';
import type { StaffRole } from '@/lib/auth/types';
import { countPendingOutbox } from '@/lib/offline/outbox-repo';
import { pushOutbox } from '@/lib/offline/push-outbox';
import {
  buildLocalAttendancePageData,
  readAttendanceSyncState,
  saveAttendanceSnapshot,
  type AttendanceSyncState,
} from '@/lib/offline/attendance-repo';
import type { AttendanceSnapshot } from '@/lib/offline/attendance-snapshot';
import {
  type RefreshOptions,
  type SyncPhase,
  scheduleBackgroundWork,
} from '@/lib/offline/silent-sync';

export type { SyncPhase };

export type PresencesSyncResult = {
  pageData: AttendancePageData | null | undefined;
  syncState: AttendanceSyncState | null | undefined;
  phase: SyncPhase;
  online: boolean;
  pendingCount: number;
  refresh: (options?: RefreshOptions) => void;
};

async function pullAttendanceSnapshot(): Promise<void> {
  const res = await fetch('/api/sync/attendance', {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`Sync HTTP ${res.status}`);
  const snapshot = (await res.json()) as AttendanceSnapshot;
  await saveAttendanceSnapshot(snapshot);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Présences 100 % locales : Dexie + outbox + sync silencieuse.
 */
export function usePresencesSync(
  schoolId: string,
  role: StaffRole,
  filters: { classId: string | null; date: string },
): PresencesSyncResult {
  const [phase, setPhase] = useState<SyncPhase>('idle');
  const [online, setOnline] = useState(true);
  const syncInFlightRef = useRef(false);

  const syncState = useLiveQuery(
    () => readAttendanceSyncState(schoolId),
    [schoolId],
  );
  const classes = useLiveQuery(
    () => getOfflineDb().classes.where('school_id').equals(schoolId).toArray(),
    [schoolId],
  );
  const students = useLiveQuery(
    () => getOfflineDb().students.where('school_id').equals(schoolId).toArray(),
    [schoolId],
  );
  const attendances = useLiveQuery(
    () =>
      getOfflineDb()
        .attendance.where('school_id')
        .equals(schoolId)
        .filter((r) => r.date === filters.date)
        .toArray(),
    [schoolId, filters.date],
  );
  const pendingCount = useLiveQuery(
    () => countPendingOutbox(schoolId),
    [schoolId],
  );

  const hasLocalCache = useMemo(
    () => Boolean(syncState?.lastSyncAt),
    [syncState?.lastSyncAt],
  );

  const pageData = useMemo(() => {
    if (classes === undefined || students === undefined) {
      return undefined;
    }
    return buildLocalAttendancePageData({
      schoolId,
      role,
      syncState: syncState ?? null,
      classes,
      students,
      attendances: attendances ?? [],
      selectedClassId: filters.classId,
      selectedDate: filters.date,
    });
  }, [
    schoolId,
    role,
    syncState,
    classes,
    students,
    attendances,
    filters.classId,
    filters.date,
  ]);

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
        .then(() => pullAttendanceSnapshot())
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
    pageData,
    syncState,
    phase,
    online,
    pendingCount: pendingCount ?? 0,
    refresh,
  };
}

export { todayIsoDate as presencesTodayIsoDate };
