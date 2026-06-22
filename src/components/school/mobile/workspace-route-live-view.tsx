'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ImpayesLiveView } from '@/components/school/impayes/impayes-live-view';
import { RecouvrementLiveView } from '@/components/school/impayes/recouvrement-live-view';
import { RapportsHub } from '@/components/school/rapports/rapports-hub';
import { CaisseReportsHub } from '@/components/school/rapports/caisse-reports-hub';
import { ImpayesReportsHub } from '@/components/school/rapports/impayes-reports-hub';
import { PresencesReportsHub } from '@/components/school/rapports/presences-reports-hub';
import { EnrollmentReportView } from '@/components/school/rapports/enrollment-report-view';
import { CashJournalLiveView } from '@/components/school/rapports/cash-journal-live-view';
import { CashJournalReportView } from '@/components/school/rapports/cash-journal-report-view';
import { ImpayesSyntheseReportView } from '@/components/school/rapports/impayes-synthese-report-view';
import { ImpayesListeReportView } from '@/components/school/rapports/impayes-liste-report-view';
import { PresencesReportPageView } from '@/components/school/rapports/presences-report-page-view';
import { WeeklyPresencesReportView } from '@/components/school/rapports/weekly-presences-report-view';
import { RepeatedAbsencesReportView } from '@/components/school/rapports/repeated-absences-report-view';
import { StudentHistoryReportView } from '@/components/school/rapports/student-history-report-view';
import { ParametresScreen } from '@/components/school/parametres-screen';
import { normalizeWorkspaceHref } from '@/lib/navigation/workspace-overlay-routes';
import { getOfflineDb } from '@/lib/offline/db';

type WorkspaceApiPayload = {
  view: string;
  data: unknown;
  search?: string;
};

function RouteSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-4 p-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-wa-divider/80" />
      <div className="h-4 w-64 animate-pulse rounded-md bg-wa-divider/80" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-wa-divider/80" />
        ))}
      </div>
    </div>
  );
}

function useWorkspaceRoutePayload(href: string) {
  const path = normalizeWorkspaceHref(href);
  const cacheKey = `workspace:${path}`;

  const cached = useLiveQuery(
    () => getOfflineDb().meta.get(cacheKey),
    [cacheKey],
  );
  const [fresh, setFresh] = useState<WorkspaceApiPayload | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/sync/workspace?href=${encodeURIComponent(href.split('#')[0])}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then((res) => (res.ok ? (res.json() as Promise<WorkspaceApiPayload>) : null))
      .then((payload) => {
        if (!alive || !payload) return;
        setFresh(payload);
        void getOfflineDb().meta.put({
          key: cacheKey,
          school_id: '',
          scope: 'workspace-route',
          value: payload,
          updated_at: new Date().toISOString(),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [href, cacheKey]);

  return fresh ?? (cached?.value as WorkspaceApiPayload | undefined) ?? null;
}

function WorkspaceRouteDataView({ href }: { href: string }) {
  const payload = useWorkspaceRoutePayload(href);
  if (!payload) return <RouteSkeleton />;

  switch (payload.view) {
    case 'rapports-hub':
      return (
        <RapportsHub
          preview={payload.data as Parameters<typeof RapportsHub>[0]['preview']}
        />
      );
    case 'effectifs':
      return (
        <EnrollmentReportView
          data={payload.data as Parameters<typeof EnrollmentReportView>[0]['data']}
        />
      );
    case 'cash-journal':
      return (
        <CashJournalReportView
          data={payload.data as Parameters<typeof CashJournalReportView>[0]['data']}
        />
      );
    case 'impayes-synthese':
      return (
        <ImpayesSyntheseReportView
          data={payload.data as Parameters<typeof ImpayesSyntheseReportView>[0]['data']}
        />
      );
    case 'impayes-liste':
      return (
        <ImpayesListeReportView
          data={payload.data as Parameters<typeof ImpayesListeReportView>[0]['data']}
          search={payload.search}
        />
      );
    case 'presences-hub':
      return (
        <PresencesReportsHub
          todayPreview={
            payload.data as Parameters<typeof PresencesReportsHub>[0]['todayPreview']
          }
        />
      );
    case 'presences-jour':
      return (
        <PresencesReportPageView
          data={payload.data as Parameters<typeof PresencesReportPageView>[0]['data']}
        />
      );
    case 'presences-hebdo':
      return (
        <WeeklyPresencesReportView
          data={payload.data as Parameters<typeof WeeklyPresencesReportView>[0]['data']}
        />
      );
    case 'presences-absences':
      return (
        <RepeatedAbsencesReportView
          data={payload.data as Parameters<typeof RepeatedAbsencesReportView>[0]['data']}
        />
      );
    case 'presences-eleve':
      return (
        <StudentHistoryReportView
          data={payload.data as Parameters<typeof StudentHistoryReportView>[0]['data']}
        />
      );
    case 'parametres': {
      const bundle = payload.data as {
        school: Parameters<typeof ParametresScreen>[0]['school'];
        referentials: Parameters<typeof ParametresScreen>[0]['referentials'];
        team: Parameters<typeof ParametresScreen>[0]['team'];
      };
      return (
        <ParametresScreen
          school={bundle.school}
          referentials={bundle.referentials}
          team={bundle.team}
        />
      );
    }
    default:
      return <RouteSkeleton />;
  }
}

type Props = {
  href: string;
  schoolId: string;
};

/** Rendu d'une route workspace en overlay (sans quitter /school). */
export function WorkspaceRouteLiveView({ href, schoolId }: Props) {
  const path = normalizeWorkspaceHref(href);

  if (path === '/school/impayes') {
    return <ImpayesLiveView schoolId={schoolId} />;
  }

  if (path.startsWith('/school/impayes/recouvrement')) {
    const params = new URLSearchParams(href.split('?')[1] ?? '');
    const feeId = params.get('frais');
    if (!feeId) return null;
    return (
      <RecouvrementLiveView
        schoolId={schoolId}
        feeId={feeId}
        search={params.get('q') ?? undefined}
        classId={params.get('classe') ?? undefined}
      />
    );
  }

  if (path === '/school/rapports/caisse') return <CaisseReportsHub />;
  if (path === '/school/rapports/impayes') return <ImpayesReportsHub />;
  if (path === '/school/rapports/caisse/journal') {
    return <CashJournalLiveView schoolId={schoolId} href={href} />;
  }

  return <WorkspaceRouteDataView href={href} />;
}
