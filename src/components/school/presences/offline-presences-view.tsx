'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { StaffRole } from '@/lib/auth/types';
import { SyncStatusBadge } from '@/components/offline/sync-status-badge';
import { PresencesSkeleton } from '@/components/school/mobile/view-skeletons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PresencesFiltersLocal } from '@/components/school/presences/presences-filters-local';
import { PresencesPanel } from '@/components/school/presences/presences-panel';
import type { AttendancePageData } from '@/lib/db/attendance-page';
import type { AttendanceStatus } from '@/lib/db/attendances';
import {
  buildPresencesPageFromSnapshots,
  presencesPaintCacheKey,
  saveAttendanceSnapshot,
} from '@/lib/offline/attendance-repo';
import { saveAttendanceBatchLocally } from '@/lib/offline/save-attendance-local';
import {
  presencesTodayIsoDate,
  usePresencesSync,
} from '@/lib/offline/use-presences-sync';
import { saveStudentsSnapshot } from '@/lib/offline/students-repo';
import { readStaleCache, writeStaleCache } from '@/lib/offline/stale-cache';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';
import type { AttendanceSnapshot } from '@/lib/offline/attendance-snapshot';
import { cn } from '@/lib/utils';

type Props = {
  schoolId: string;
  role: StaffRole;
  initialSnapshot: AttendanceSnapshot | null;
  studentsSnapshot: StudentsSnapshot | null;
};

function readPresencesPaint(
  schoolId: string,
  role: StaffRole,
  date: string,
  classId: string | null,
  attendanceSnapshot: AttendanceSnapshot | null,
  studentsSnapshot: StudentsSnapshot | null,
): AttendancePageData | null {
  const cached = readStaleCache<AttendancePageData>(
    presencesPaintCacheKey(schoolId, date, classId),
  );
  if (cached) return cached;

  if (attendanceSnapshot && studentsSnapshot) {
    return buildPresencesPageFromSnapshots(
      attendanceSnapshot,
      studentsSnapshot,
      role,
      classId,
      date,
    );
  }

  return null;
}

export function OfflinePresencesView({
  schoolId,
  role,
  initialSnapshot,
  studentsSnapshot,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(presencesTodayIsoDate);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const [paintData, setPaintData] = useState<AttendancePageData | null>(() =>
    readPresencesPaint(
      schoolId,
      role,
      presencesTodayIsoDate(),
      null,
      initialSnapshot,
      studentsSnapshot,
    ),
  );

  useEffect(() => {
    const next = readPresencesPaint(
      schoolId,
      role,
      selectedDate,
      selectedClassId,
      initialSnapshot,
      studentsSnapshot,
    );
    setPaintData(next);
  }, [
    schoolId,
    role,
    selectedDate,
    selectedClassId,
    initialSnapshot,
    studentsSnapshot,
  ]);

  useEffect(() => {
    if (initialSnapshot) {
      void saveAttendanceSnapshot(initialSnapshot);
    }
  }, [initialSnapshot]);

  useEffect(() => {
    if (studentsSnapshot) {
      void saveStudentsSnapshot(studentsSnapshot);
    }
  }, [studentsSnapshot]);

  const { pageData, syncState, phase, online, pendingCount, refresh } =
    usePresencesSync(schoolId, role, {
      classId: selectedClassId,
      date: selectedDate,
    });

  const displayData = pageData !== undefined ? pageData : paintData;
  const displaySyncState =
    syncState !== undefined
      ? syncState
      : initialSnapshot
        ? {
            activeYear: initialSnapshot.activeYear,
            teacherClassIds: initialSnapshot.teacherClassIds,
            teacherLimited: initialSnapshot.teacherLimited,
            lastSyncAt: initialSnapshot.generatedAt,
          }
        : null;

  useEffect(() => {
    if (pageData === undefined || pageData === null) return;
    writeStaleCache(
      presencesPaintCacheKey(
        schoolId,
        pageData.selectedDate,
        pageData.selectedClassId,
      ),
      pageData,
    );
  }, [pageData, schoolId]);

  const resolvedClassId = displayData?.selectedClassId ?? null;

  useEffect(() => {
    if (resolvedClassId && resolvedClassId !== selectedClassId) {
      setSelectedClassId(resolvedClassId);
    }
  }, [resolvedClassId, selectedClassId]);

  const handleSaveLocal = useCallback(
    async (input: {
      classId: string;
      date: string;
      entries: { studentId: string; status: AttendanceStatus }[];
    }) => {
      const result = await saveAttendanceBatchLocally({
        schoolId,
        ...input,
      });
      if (!result.ok) return result;
      if (online) {
        scheduleSilentPush(refresh);
      }
      return { ok: true as const, saved: result.saved };
    },
    [schoolId, online, refresh],
  );

  const loading = displayData === null && pageData === undefined;

  const stats = displayData?.stats;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-0">
        <PresencesSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-0">
      <div className="no-print flex items-center justify-end px-4 py-2">
        <SyncStatusBadge
          phase={phase}
          online={online}
          lastSyncAt={displaySyncState?.lastSyncAt ?? null}
          pendingCount={pendingCount}
          onRefresh={refresh}
        />
      </div>

      {!displayData ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link
              href="/school/parametres#referentiels"
              className="font-medium text-primary underline"
            >
              année scolaire active
            </Link>{' '}
            et des classes.
          </AlertDescription>
        </Alert>
      ) : displayData.classes.length === 0 ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            {displayData.teacherLimited
              ? 'Aucune classe ne vous est assignée. Contactez la direction.'
              : 'Aucune classe pour cette année. Ajoutez des classes dans les référentiels.'}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {stats && stats.total > 0 ? (
            <div className="grid grid-cols-4 gap-px border-b border-wa-divider bg-wa-divider">
              <StatCard label="Inscrits" value={stats.total} />
              <StatCard
                label="Présents"
                value={stats.present}
                valueClassName="text-emerald-700"
              />
              <StatCard
                label="Absents"
                value={stats.absent}
                valueClassName="text-destructive"
              />
              <StatCard
                label="Retards"
                value={stats.late}
                valueClassName="text-amber-600"
              />
            </div>
          ) : null}

          <div className="border-b border-wa-divider bg-wa-panel px-4 py-3">
            <PresencesFiltersLocal
              classes={displayData.classes}
              selectedClassId={displayData.selectedClassId}
              selectedDate={displayData.selectedDate}
              onClassChange={setSelectedClassId}
              onDateChange={setSelectedDate}
            />
          </div>

          {displayData.rows.length === 0 ? (
            <Alert className="mx-4 mt-4">
              <AlertDescription>
                Aucun élève inscrit dans cette classe pour{' '}
                {displayData.activeYear.name}.
              </AlertDescription>
            </Alert>
          ) : (
            <PresencesPanel
              key={`${displayData.selectedClassId}-${displayData.selectedDate}`}
              data={displayData}
              basePath="/app/presences"
              onSaveLocal={handleSaveLocal}
            />
          )}
        </>
      )}
    </div>
  );
}

function scheduleSilentPush(refresh: () => void) {
  if (typeof window === 'undefined') return;
  const ric = (
    window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
    }
  ).requestIdleCallback;
  if (ric) ric(() => refresh());
  else setTimeout(refresh, 200);
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="bg-wa-panel px-2 py-2.5 text-center sm:py-3">
      <p className={cn('type-stat-value', valueClassName)}>{value}</p>
      <p className="type-stat-label mt-1">{label}</p>
    </div>
  );
}
