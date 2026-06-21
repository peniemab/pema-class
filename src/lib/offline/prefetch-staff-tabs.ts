'use client';

import type { StaffRole } from '@/lib/auth/types';
import type { AppTabKey } from '@/lib/navigation/app-tab-context';
import {
  buildPresencesPageFromSnapshots,
  presencesPaintCacheKey,
  saveAttendanceSnapshot,
} from '@/lib/offline/attendance-repo';
import {
  caissePaintCacheKey,
  caissePaintFromSnapshot,
  saveCaisseSnapshot,
} from '@/lib/offline/caisse-repo';
import { scheduleBackgroundWork } from '@/lib/offline/silent-sync';
import {
  saveStudentsSnapshot,
  studentsPaintCacheKey,
  studentsPaintFromSnapshot,
} from '@/lib/offline/students-repo';
import { writeStaleCache } from '@/lib/offline/stale-cache';
import { presencesTodayIsoDate } from '@/lib/offline/use-presences-sync';
import type { AttendanceSnapshot } from '@/lib/offline/attendance-snapshot';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Précharge les snapshots des onglets autorisés (idle) — style WhatsApp Web. */
export function prefetchStaffTabSnapshots(input: {
  schoolId: string;
  staffId: string;
  role: StaffRole;
  tabKeys: AppTabKey[];
}): () => void {
  return scheduleBackgroundWork(async () => {
    const { schoolId, role, tabKeys } = input;
    const needStudents =
      tabKeys.includes('eleves') || tabKeys.includes('presences');

    let studentsSnapshot: StudentsSnapshot | null = null;

    if (needStudents) {
      studentsSnapshot = await fetchJson<StudentsSnapshot>('/api/sync/students');
      if (studentsSnapshot) {
        writeStaleCache(
          studentsPaintCacheKey(schoolId),
          studentsPaintFromSnapshot(studentsSnapshot),
        );
        await saveStudentsSnapshot(studentsSnapshot);
      }
    }

    if (tabKeys.includes('caisse')) {
      const caisseSnapshot = await fetchJson<CaisseSnapshot>('/api/sync/caisse');
      if (caisseSnapshot) {
        writeStaleCache(
          caissePaintCacheKey(schoolId),
          caissePaintFromSnapshot(caisseSnapshot),
        );
        await saveCaisseSnapshot(caisseSnapshot);
      }
    }

    if (tabKeys.includes('presences')) {
      const attendanceSnapshot =
        await fetchJson<AttendanceSnapshot>('/api/sync/attendance');
      if (attendanceSnapshot) {
        await saveAttendanceSnapshot(attendanceSnapshot);
        if (studentsSnapshot) {
          const pageData = buildPresencesPageFromSnapshots(
            attendanceSnapshot,
            studentsSnapshot,
            role,
            null,
            presencesTodayIsoDate(),
          );
          if (pageData) {
            writeStaleCache(
              presencesPaintCacheKey(
                schoolId,
                pageData.selectedDate,
                pageData.selectedClassId,
              ),
              pageData,
            );
          }
        }
      }
    }
  });
}
