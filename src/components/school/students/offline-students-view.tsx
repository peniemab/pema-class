'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, UserPlus } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button-link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StudentsTable } from '@/components/school/students/students-table';
import { StudentDetailPanel } from '@/components/school/students/student-detail-panel';
import { StudentsSkeleton } from '@/components/school/mobile/view-skeletons';
import { SyncStatusBadge } from '@/components/offline/sync-status-badge';
import { useStudentsSync } from '@/lib/offline/use-students-sync';
import {
  saveStudentsSnapshot,
  studentsPaintCacheKey,
  studentsPaintFromSnapshot,
  type StudentsPaintBundle,
} from '@/lib/offline/students-repo';
import {
  filterLocalStudents,
  toDirectoryRow,
  type LocalStudentsFilters,
} from '@/lib/offline/students-filter';
import { readStaleCache, writeStaleCache } from '@/lib/offline/stale-cache';

import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';

import { SCHOOL_STUDENTS_BASE, studentsPath } from '@/lib/navigation/students-paths';

function readStudentsPaint(
  schoolId: string,
  initialSnapshot: StudentsSnapshot | null,
): StudentsPaintBundle | null {
  const cached = readStaleCache<StudentsPaintBundle>(
    studentsPaintCacheKey(schoolId),
  );
  if (cached) return cached;
  if (initialSnapshot) return studentsPaintFromSnapshot(initialSnapshot);
  return null;
}

type Props = {
  schoolId: string;
  initialSnapshot: StudentsSnapshot | null;
  studentsBase?: string;
};

export function OfflineStudentsView({
  schoolId,
  initialSnapshot,
  studentsBase = SCHOOL_STUDENTS_BASE,
}: Props) {
  const { students, classes, state, phase, online, pendingCount, refresh } =
    useStudentsSync(schoolId);

  const [paint, setPaint] = useState<StudentsPaintBundle | null>(() =>
    readStudentsPaint(schoolId, initialSnapshot),
  );

  useEffect(() => {
    setPaint(readStudentsPaint(schoolId, initialSnapshot));
  }, [schoolId, initialSnapshot]);

  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Amorce Dexie en arrière-plan (peinture via sessionStorage / snapshot).
  useEffect(() => {
    if (initialSnapshot) {
      void saveStudentsSnapshot(initialSnapshot);
    }
  }, [initialSnapshot]);

  useEffect(() => {
    if (students === undefined || classes === undefined || state === undefined) {
      return;
    }
    writeStaleCache(studentsPaintCacheKey(schoolId), {
      students,
      classes,
      state: state ?? {
        activeYear: null,
        stats: null,
        lastSyncAt: null,
      },
    });
  }, [students, classes, state, schoolId]);

  const allStudents = students ?? paint?.students ?? [];
  const syncState = state !== undefined ? state : (paint?.state ?? null);

  const filters: LocalStudentsFilters = useMemo(
    () => ({
      search: search || undefined,
      classId: classId || undefined,
      status,
      unassignedOnly,
    }),
    [search, classId, status, unassignedOnly],
  );

  const filtered = useMemo(
    () => filterLocalStudents(allStudents, filters),
    [allStudents, filters],
  );

  const pendingIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of allStudents) {
      if (s.sync_status === 'pending') set.add(s.id);
    }
    return set;
  }, [allStudents]);

  const stats = useMemo(() => {
    const active = allStudents.filter((s) => s.status === 'active');
    const enrolled = active.filter((s) => s.class_id).length;
    return {
      total: active.length,
      enrolled,
      unassigned: Math.max(0, active.length - enrolled),
    };
  }, [allStudents]);

  const sortedClasses = useMemo(
    () =>
      [...(classes ?? paint?.classes ?? [])].sort(
        (a, b) =>
          a.level.localeCompare(b.level, 'fr') ||
          a.name.localeCompare(b.name, 'fr'),
      ),
    [classes, paint?.classes],
  );

  const activeYear =
    syncState?.activeYear ?? initialSnapshot?.activeYear ?? null;
  const loading = students === undefined && !paint;
  const hasFilters =
    Boolean(search) || Boolean(classId) || status !== 'all' || unassignedOnly;

  function clearFilters() {
    setSearch('');
    setClassId('');
    setStatus('all');
    setUnassignedOnly(false);
  }

  // Fiche élève en panneau (master-detail) — aucune navigation serveur,
  // fonctionne hors ligne. Le bouton « retour » du téléphone ferme le panneau.
  useEffect(() => {
    const onPop = () => setSelectedId(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openStudent = useCallback((id: string) => {
    setSelectedId(id);
    window.history.pushState({ pema: 'student' }, '');
  }, []);

  const closeStudent = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      (window.history.state as { pema?: string } | null)?.pema === 'student'
    ) {
      window.history.back();
    } else {
      setSelectedId(null);
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-0">
      {loading ? (
        <StudentsSkeleton />
      ) : (
        <>
      <div className="no-print flex items-center justify-end px-4 py-2">
        <SyncStatusBadge
          phase={phase}
          online={online}
          lastSyncAt={syncState?.lastSyncAt ?? null}
          pendingCount={pendingCount}
          onRefresh={refresh}
        />
      </div>

      {activeYear ? (
        <div className="no-print fixed bottom-[calc(3.25rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-30 md:bottom-6">
          <ButtonLink
            href={studentsPath(studentsBase, 'nouveau')}
            size="icon"
            className="size-14 rounded-full bg-primary shadow-lg hover:bg-primary-dark"
            aria-label="Inscrire un élève"
          >
            <UserPlus className="size-6" aria-hidden />
          </ButtonLink>
        </div>
      ) : null}

      {!activeYear ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link
              href="/school/parametres#referentiels"
              className="font-medium text-wa-accent underline"
            >
              année scolaire active
            </Link>{' '}
            et des classes.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-px border-b border-wa-divider bg-wa-divider">
            <div className="bg-wa-panel px-3 py-3">
              <p className="text-xl font-semibold tabular-nums">{stats.total}</p>
              <p className="text-[0.6875rem] text-wa-text-secondary">Actifs</p>
            </div>
            <div className="bg-wa-panel px-3 py-3">
              <p className="text-xl font-semibold tabular-nums">
                {stats.enrolled}
              </p>
              <p className="text-[0.6875rem] text-wa-text-secondary">Inscrits</p>
            </div>
            <div className="bg-wa-panel px-3 py-3">
              <p className="text-xl font-semibold tabular-nums">
                {stats.unassigned}
              </p>
              <p className="text-[0.6875rem] text-wa-text-secondary">
                Sans classe
              </p>
            </div>
          </div>

          <div className="space-y-3 border-b border-wa-divider bg-wa-panel px-4 py-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wa-text-secondary"
                aria-hidden
              />
              <input
                type="search"
                inputMode="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un élève (nom, matricule)…"
                className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="Rechercher un élève"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                aria-label="Filtrer par classe"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Toutes les classes</option>
                {sortedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.level} {c.name}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'all' | 'active' | 'inactive')
                }
                aria-label="Filtrer par statut"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => setUnassignedOnly(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Sans classe
              </label>
              {hasFilters ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearFilters}
                >
                  Effacer
                </Button>
              ) : null}
              <span className="ml-auto text-xs text-wa-text-secondary tabular-nums">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {allStudents.length === 0 && !hasFilters ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-wa-text-secondary">
                {activeYear
                  ? `Aucun élève inscrit pour ${activeYear.name}.`
                  : 'Aucun élève en cache.'}
              </p>
              <ButtonLink
                href={studentsPath(studentsBase, 'nouveau')}
                className="mt-4 gap-1.5 bg-primary hover:bg-primary-dark"
                size="sm"
              >
                <Plus className="size-4" aria-hidden />
                Première inscription
              </ButtonLink>
            </div>
          ) : (
            <StudentsTable
              rows={filtered.map(toDirectoryRow)}
              onSelect={openStudent}
              pendingIds={pendingIds}
            />
          )}
        </>
      )}

      {selectedId ? (
        <StudentDetailPanel
          studentId={selectedId}
          schoolId={schoolId}
          academicYearId={activeYear?.id ?? null}
          activeYearName={activeYear?.name ?? null}
          classes={sortedClasses}
          online={online}
          onClose={closeStudent}
          onSync={refresh}
        />
      ) : null}
        </>
      )}
    </div>
  );
}
