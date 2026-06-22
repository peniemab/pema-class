'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SyncStatusBadge } from '@/components/offline/sync-status-badge';
import { PresencesSkeleton } from '@/components/school/mobile/view-skeletons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PresencesFiltersLocal } from '@/components/school/presences/presences-filters-local';
import { PresencesPanel } from '@/components/school/presences/presences-panel';
import type { AttendanceStatus } from '@/lib/db/attendances';
import { buildLocalAttendancePageData } from '@/lib/offline/attendance-repo';
import { saveAttendanceBatchLocally } from '@/lib/offline/save-attendance-local';
import { useAppData } from '@/lib/offline/app-data-context';
import { cn } from '@/lib/utils';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function OfflinePresencesView() {
  const {
    schoolId,
    role,
    classes,
    students,
    attendance,
    attendanceState,
    phase,
    online,
    pendingCount,
    refresh,
    hydrating,
  } = useAppData();

  const [selectedDate, setSelectedDate] = useState(todayIsoDate);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const pageData = useMemo(
    () =>
      buildLocalAttendancePageData({
        schoolId,
        role,
        syncState: attendanceState,
        classes,
        students,
        attendances: attendance,
        selectedClassId,
        selectedDate,
      }),
    [
      schoolId,
      role,
      attendanceState,
      classes,
      students,
      attendance,
      selectedClassId,
      selectedDate,
    ],
  );

  const resolvedClassId = pageData?.selectedClassId ?? null;
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
      const result = await saveAttendanceBatchLocally({ schoolId, ...input });
      if (!result.ok) return result;
      if (online) scheduleSilentPush(refresh);
      return { ok: true as const, saved: result.saved };
    },
    [schoolId, online, refresh],
  );

  const stats = pageData?.stats;

  if (hydrating) {
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
          lastSyncAt={attendanceState?.lastSyncAt ?? null}
          pendingCount={pendingCount}
          onRefresh={refresh}
        />
      </div>

      {!pageData ? (
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
      ) : pageData.classes.length === 0 ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            {pageData.teacherLimited
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
              classes={pageData.classes}
              selectedClassId={pageData.selectedClassId}
              selectedDate={pageData.selectedDate}
              onClassChange={setSelectedClassId}
              onDateChange={setSelectedDate}
            />
          </div>

          {pageData.rows.length === 0 ? (
            <Alert className="mx-4 mt-4">
              <AlertDescription>
                Aucun élève inscrit dans cette classe pour{' '}
                {pageData.activeYear.name}.
              </AlertDescription>
            </Alert>
          ) : (
            <PresencesPanel
              key={`${pageData.selectedClassId}-${pageData.selectedDate}`}
              data={pageData}
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
