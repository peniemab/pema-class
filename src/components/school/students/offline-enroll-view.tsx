'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { OfflineEnrollStudentForm } from '@/components/school/students/offline-enroll-student-form';
import { SyncStatusBadge } from '@/components/offline/sync-status-badge';
import { useStudentsSync } from '@/lib/offline/use-students-sync';
import { saveStudentsSnapshot } from '@/lib/offline/students-repo';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';

import {
  SCHOOL_STUDENTS_BASE,
  studentsCaisseBase,
} from '@/lib/navigation/students-paths';

type Props = {
  schoolId: string;
  initialSnapshot: StudentsSnapshot | null;
  studentsBase?: string;
};

export function OfflineEnrollView({
  schoolId,
  initialSnapshot,
  studentsBase = SCHOOL_STUDENTS_BASE,
}: Props) {
  const { classes, state, phase, online, pendingCount, refresh } =
    useStudentsSync(schoolId);

  useEffect(() => {
    if (initialSnapshot) {
      void saveStudentsSnapshot(initialSnapshot);
    }
  }, [initialSnapshot]);

  const activeYear = state?.activeYear ?? initialSnapshot?.activeYear ?? null;
  const localClasses = classes ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={studentsBase}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Annuaire
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Inscrire un élève
          </h1>
          {activeYear ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Année {activeYear.name} — inscription locale d&apos;abord, sync
              cloud ensuite.
            </p>
          ) : null}
        </div>
        <SyncStatusBadge
          phase={phase}
          online={online}
          lastSyncAt={state?.lastSyncAt}
          pendingCount={pendingCount}
          onRefresh={refresh}
        />
      </div>

      {activeYear ? (
        <OfflineEnrollStudentForm
          schoolId={schoolId}
          academicYearId={activeYear.id}
          activeYearName={activeYear.name}
          classes={localClasses}
          online={online}
          studentsBase={studentsBase}
          caisseBase={studentsCaisseBase(studentsBase)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Configurez une année scolaire active ou reconnectez-vous pour
          synchroniser.
        </p>
      )}
    </div>
  );
}
