'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { StaffRole } from '@/lib/auth/types';
import { useAppTabsOptional, type AppTabKey } from '@/lib/navigation/app-tab-context';
import { KeepAliveTabs } from '@/components/navigation/keep-alive-tabs';
import { SchoolDashboardLive } from '@/components/school/school-dashboard-live';
import { SchoolToolsPage } from '@/components/school/school-tools-page';
import { OfflineStudentsView } from '@/components/school/students/offline-students-view';
import { OfflinePresencesView } from '@/components/school/presences/offline-presences-view';
import { OfflineCaisseHomeView } from '@/components/school/caisse/offline-caisse-home-view';
import { OfflineCaisseStudentView } from '@/components/school/caisse/offline-caisse-student-view';
import { AppDataProvider } from '@/lib/offline/app-data-context';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import type { AttendanceSnapshot } from '@/lib/offline/attendance-snapshot';

type Props = {
  role: StaffRole;
  schoolId: string;
  staffId: string;
  studentsSnapshot: StudentsSnapshot | null;
  caisseSnapshot: CaisseSnapshot | null;
  attendanceSnapshot: AttendanceSnapshot | null;
};

/**
 * Workspace /school (direction) — même modèle WhatsApp que /app :
 * magasin unique en mémoire + onglets keep-alive (Accueil, Élèves,
 * Présences, Caisse, Outils). Changement d'onglet = 0 rechargement.
 */
export function DirectionWorkspace({
  role,
  schoolId,
  staffId,
  studentsSnapshot,
  caisseSnapshot,
  attendanceSnapshot,
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
    () => <SchoolDashboardLive schoolId={schoolId} />,
    [schoolId],
  );
  const elevesPanel = useMemo(() => <OfflineStudentsView />, []);
  const presencesPanel = useMemo(
    () => <OfflinePresencesView basePath="/school/presences" />,
    [],
  );
  const caissePanel = useMemo(
    () => (
      <OfflineCaisseHomeView
        caisseBasePath="/school/caisse"
        onOpenStudent={openCaisseStudent}
      />
    ),
    [openCaisseStudent],
  );
  const outilsPanel = useMemo(() => <SchoolToolsPage />, []);

  const allTabs = useMemo(
    () =>
      [
        { key: 'accueil' as const, content: accueilPanel },
        { key: 'eleves' as const, content: elevesPanel },
        { key: 'presences' as const, content: presencesPanel },
        { key: 'caisse' as const, content: caissePanel },
        { key: 'outils' as const, content: outilsPanel },
      ].filter((t) => tabKeys.includes(t.key)),
    [
      accueilPanel,
      elevesPanel,
      presencesPanel,
      caissePanel,
      outilsPanel,
      tabKeys,
    ],
  );

  return (
    <AppDataProvider
      schoolId={schoolId}
      staffId={staffId}
      role={role}
      studentsSnapshot={studentsSnapshot}
      caisseSnapshot={caisseSnapshot}
      attendanceSnapshot={attendanceSnapshot}
    >
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
              caisseBasePath="/school/caisse"
              initialSnapshot={caisseSnapshot}
            />
          </div>
        </div>
      ) : null}
    </AppDataProvider>
  );
}
