'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import type { StaffRole } from '@/lib/auth/types';
import { useAppTabsOptional, type AppTabKey } from '@/lib/navigation/app-tab-context';
import { KeepAliveTabs } from '@/components/navigation/keep-alive-tabs';
import { APP_STUDENTS_BASE } from '@/lib/navigation/students-paths';
import type { StaffDashboardPageData } from '@/lib/school/load-staff-dashboard-page';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import type { AttendancePageData } from '@/lib/db/attendance-page';

/** Indicateur de chargement le temps que le bundle de l'onglet arrive. */
function TabFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-wa-text-secondary">
      Chargement…
    </div>
  );
}

// Imports 100 % dynamiques, SSR désactivé → écrans rendus côté client
// uniquement (fonctionnent hors-ligne via le cache IndexedDB).
const StaffDashboard = dynamic(
  () =>
    import('@/components/school/staff-dashboard').then((m) => ({
      default: m.StaffDashboard,
    })),
  { ssr: false, loading: TabFallback },
);

const OfflineStudentsView = dynamic(
  () =>
    import('@/components/school/students/offline-students-view').then((m) => ({
      default: m.OfflineStudentsView,
    })),
  { ssr: false, loading: TabFallback },
);

const PresencesPageView = dynamic(
  () =>
    import('@/components/school/presences/presences-page-view').then((m) => ({
      default: m.PresencesPageView,
    })),
  { ssr: false, loading: TabFallback },
);

const OfflineCaisseHomeView = dynamic(
  () =>
    import('@/components/school/caisse/offline-caisse-home-view').then((m) => ({
      default: m.OfflineCaisseHomeView,
    })),
  { ssr: false, loading: TabFallback },
);

const OfflineCaisseStudentView = dynamic(
  () =>
    import('@/components/school/caisse/offline-caisse-student-view').then((m) => ({
      default: m.OfflineCaisseStudentView,
    })),
  { ssr: false, loading: TabFallback },
);

type Props = {
  role: StaffRole;
  schoolId: string;
  dashboard: StaffDashboardPageData;
  studentsSnapshot: StudentsSnapshot | null;
  caisseSnapshot: CaisseSnapshot | null;
  attendance: AttendancePageData | null;
};

/**
 * Page racine unique du personnel (/app).
 * Tous les onglets de la bottom nav vivent ici, gardés en mémoire.
 * Le header et la bottom nav (shell partagé) pilotent `activeTab`.
 */
export function StaffWorkspace({
  role,
  schoolId,
  dashboard,
  studentsSnapshot,
  caisseSnapshot,
  attendance,
}: Props) {
  const tabs = useAppTabsOptional();
  const activeTab: AppTabKey = tabs?.activeTab ?? 'accueil';
  const tabKeys = tabs?.tabKeys ?? ['accueil'];

  // Encaissement en panneau (overlay) — aucune navigation serveur, offline OK.
  const [caisseStudentId, setCaisseStudentId] = useState<string | null>(null);

  const openCaisseStudent = useCallback((studentId: string) => {
    setCaisseStudentId(studentId);
    window.history.pushState({ pema: 'caisse-student' }, '');
  }, []);

  const closeCaisseStudent = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      (window.history.state as { pema?: string } | null)?.pema ===
        'caisse-student'
    ) {
      window.history.back();
    } else {
      setCaisseStudentId(null);
    }
  }, []);

  useEffect(() => {
    const onPop = () => setCaisseStudentId(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const allTabs: { key: AppTabKey; render: () => React.ReactNode }[] = [
    {
      key: 'accueil',
      render: () => <StaffDashboard data={dashboard} role={role} />,
    },
    {
      key: 'eleves',
      render: () => (
        <OfflineStudentsView
          schoolId={schoolId}
          initialSnapshot={studentsSnapshot}
          studentsBase={APP_STUDENTS_BASE}
        />
      ),
    },
    {
      key: 'presences',
      render: () => (
        <PresencesPageView data={attendance} basePath="/app/presences" />
      ),
    },
    {
      key: 'caisse',
      render: () => (
        <OfflineCaisseHomeView
          schoolId={schoolId}
          caisseBasePath="/app/caisse"
          initialSnapshot={caisseSnapshot}
          onOpenStudent={openCaisseStudent}
        />
      ),
    },
  ];

  const visibleTabs = allTabs.filter((t) => tabKeys.includes(t.key));

  return (
    <>
      <KeepAliveTabs activeKey={activeTab} tabs={visibleTabs} />

      {caisseStudentId ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-wa-bg">
          <div className="no-print sticky top-0 z-10 flex h-14 shrink-0 items-center gap-1 bg-wa-header px-2 text-wa-header-foreground safe-top">
            <button
              type="button"
              onClick={closeCaisseStudent}
              className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </button>
            <h2 className="min-w-0 flex-1 truncate text-lg font-medium">
              Encaissement
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto safe-bottom">
            <OfflineCaisseStudentView
              schoolId={schoolId}
              studentId={caisseStudentId}
              caisseBasePath="/app/caisse"
              initialSnapshot={caisseSnapshot}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
