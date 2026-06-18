'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getOfflineDb } from '@/lib/offline/db';
import {
  readStudentsSyncState,
  saveStudentsSnapshot,
  type StudentsSyncState,
} from '@/lib/offline/students-repo';
import type { LocalStudent, LocalClass } from '@/lib/offline/db';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';

export type SyncPhase = 'idle' | 'syncing' | 'error';

export type StudentsSyncResult = {
  students: LocalStudent[] | undefined;
  classes: LocalClass[] | undefined;
  state: StudentsSyncState | null | undefined;
  phase: SyncPhase;
  online: boolean;
  refresh: () => void;
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
 * Lecture locale (instantanée) + pull cloud en arrière-plan.
 * Façon Contacts : l'écran s'affiche depuis IndexedDB, la sync suit.
 */
export function useStudentsSync(schoolId: string): StudentsSyncResult {
  const [phase, setPhase] = useState<SyncPhase>('idle');
  const [online, setOnline] = useState(true);

  const students = useLiveQuery(
    () => getOfflineDb().students.where('school_id').equals(schoolId).toArray(),
    [schoolId],
  );
  const classes = useLiveQuery(
    () => getOfflineDb().classes.where('school_id').equals(schoolId).toArray(),
    [schoolId],
  );
  const state = useLiveQuery(() => readStudentsSyncState(schoolId), [schoolId]);

  const refresh = useCallback(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setPhase('error');
      return;
    }
    setPhase('syncing');
    pullSnapshot()
      .then(() => setPhase('idle'))
      .catch(() => setPhase('error'));
  }, []);

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

  return { students, classes, state, phase, online, refresh };
}
