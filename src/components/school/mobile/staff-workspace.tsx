'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { StaffRole } from '@/lib/auth/types';
import { useAppTabsOptional, type AppTabKey } from '@/lib/navigation/app-tab-context';
import { KeepAliveTabs } from '@/components/navigation/keep-alive-tabs';
import { APP_STUDENTS_BASE } from '@/lib/navigation/students-paths';
import { StaffDashboard } from '@/components/school/staff-dashboard';
import { OfflineStudentsView } from '@/components/school/students/offline-students-view';
import { PresencesPageView } from '@/components/school/presences/presences-page-view';
import { OfflineCaisseHomeView } from '@/components/school/caisse/offline-caisse-home-view';
import { OfflineCaisseStudentView } from '@/components/school/caisse/offline-caisse-student-view';
import type { StaffDashboardPageData } from '@/lib/school/load-staff-dashboard-page';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import type { AttendancePageData } from '@/lib/db/attendance-page';

type Props = {
  role: StaffRole;
  schoolId: string;
  dashboard: StaffDashboardPageData;
  studentsSnapshot: StudentsSnapshot | null;
  caisseSnapshot: CaisseSnapshot | null;
  attendance: AttendancePageData | null;
};

/**
 * Workspace /app — tous les onglets montés dès le chargement.
 * Le design (caisse, élèves, etc.) reste en place ; on ne fait que
 * masquer/afficher avec `hidden` — aucun rechargement visuel.
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

  const accueilPanel = useMemo(
    () => <StaffDashboard data={dashboard} role={role} />,
    [dashboard, role],
  );

  const elevesPanel = useMemo(
    () => (
      <OfflineStudentsView
        schoolId={schoolId}
        initialSnapshot={studentsSnapshot}
        studentsBase={APP_STUDENTS_BASE}
      />
    ),
    [schoolId, studentsSnapshot],
  );

  const presencesPanel = useMemo(
    () => (
      <PresencesPageView data={attendance} basePath="/app/presences" />
    ),
    [attendance],
  );

  const caissePanel = useMemo(
    () => (
      <OfflineCaisseHomeView
        schoolId={schoolId}
        caisseBasePath="/app/caisse"
        initialSnapshot={caisseSnapshot}
        onOpenStudent={openCaisseStudent}
      />
    ),
    [schoolId, caisseSnapshot, openCaisseStudent],
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
      <KeepAliveTabs activeKey={activeTab} tabs={allTabs} eager />

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
