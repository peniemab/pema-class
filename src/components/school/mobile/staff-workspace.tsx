'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import type { StaffRole } from '@/lib/auth/types';
import { useAppTabsOptional, type AppTabKey } from '@/lib/navigation/app-tab-context';
import { KeepAliveTabs } from '@/components/navigation/keep-alive-tabs';
import {
  CaisseSkeleton,
  PresencesSkeleton,
  StudentsSkeleton,
} from '@/components/school/mobile/view-skeletons';
import { APP_STUDENTS_BASE } from '@/lib/navigation/students-paths';
import { StaffDashboard } from '@/components/school/staff-dashboard';
import { prefetchStaffTabSnapshots } from '@/lib/offline/prefetch-staff-tabs';
import type { StaffDashboardPageData } from '@/lib/school/load-staff-dashboard-page';

const OfflineStudentsView = dynamic(
  () =>
    import('@/components/school/students/offline-students-view').then(
      (mod) => mod.OfflineStudentsView,
    ),
  { loading: () => <StudentsSkeleton /> },
);

const OfflinePresencesView = dynamic(
  () =>
    import('@/components/school/presences/offline-presences-view').then(
      (mod) => mod.OfflinePresencesView,
    ),
  { loading: () => <PresencesSkeleton /> },
);

const OfflineCaisseHomeView = dynamic(
  () =>
    import('@/components/school/caisse/offline-caisse-home-view').then(
      (mod) => mod.OfflineCaisseHomeView,
    ),
  { loading: () => <CaisseSkeleton /> },
);

const OfflineCaisseStudentView = dynamic(
  () =>
    import('@/components/school/caisse/offline-caisse-student-view').then(
      (mod) => mod.OfflineCaisseStudentView,
    ),
  { ssr: false },
);

type Props = {
  role: StaffRole;
  schoolId: string;
  staffId: string;
  dashboard: StaffDashboardPageData;
};

/**
 * Workspace /app — shell WhatsApp Web :
 * - accueil monté tout de suite (données serveur)
 * - autres onglets : lazy + keep-alive + prefetch idle
 */
export function StaffWorkspace({
  role,
  schoolId,
  staffId,
  dashboard,
}: Props) {
  const tabs = useAppTabsOptional();
  const activeTab: AppTabKey = tabs?.activeTab ?? 'accueil';
  const tabKeys = tabs?.tabKeys ?? ['accueil'];

  const [caisseStudentId, setCaisseStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (tabKeys.length <= 1) return;
    return prefetchStaffTabSnapshots({
      schoolId,
      staffId,
      role,
      tabKeys,
    });
  }, [schoolId, staffId, role, tabKeys]);

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

  const accueilPanel = useMemo(
    () => <StaffDashboard data={dashboard} role={role} />,
    [dashboard, role],
  );

  const elevesPanel = useMemo(
    () => (
      <OfflineStudentsView
        schoolId={schoolId}
        initialSnapshot={null}
        studentsBase={APP_STUDENTS_BASE}
      />
    ),
    [schoolId],
  );

  const presencesPanel = useMemo(
    () => (
      <OfflinePresencesView
        schoolId={schoolId}
        role={role}
        initialSnapshot={null}
        studentsSnapshot={null}
      />
    ),
    [schoolId, role],
  );

  const caissePanel = useMemo(
    () => (
      <OfflineCaisseHomeView
        schoolId={schoolId}
        caisseBasePath="/app/caisse"
        initialSnapshot={null}
        onOpenStudent={openCaisseStudent}
      />
    ),
    [schoolId, openCaisseStudent],
  );

  const allTabs = useMemo(
    () =>
      [
        { key: 'accueil' as const, content: accueilPanel },
        { key: 'eleves' as const, content: elevesPanel },
        { key: 'presences' as const, content: presencesPanel },
        { key: 'caisse' as const, content: caissePanel },
      ].filter((t) => tabKeys.includes(t.key)),
    [accueilPanel, elevesPanel, presencesPanel, caissePanel, tabKeys],
  );

  return (
    <>
      <KeepAliveTabs activeKey={activeTab} tabs={allTabs} eager={false} />

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
              initialSnapshot={null}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
