'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { EnrollmentReportView } from '@/components/school/rapports/enrollment-report-view';
import { getOfflineDb, metaKey } from '@/lib/offline/db';
import type { DashboardPageData } from '@/lib/db/dashboard-page';
import type { EnrollmentReportData } from '@/lib/db/finance-reports';
import { useAppData } from '@/lib/offline/app-data-context';
import { buildEnrollmentFromAppData } from '@/lib/offline/enrollment-local';
import { ENROLLMENT_META_SCOPE } from '@/lib/offline/prefetch-enrollment';
import { reportsBaseForHref } from '@/lib/navigation/workspace-route-utils';
import { cn } from '@/lib/utils';

const DASHBOARD_SCOPE = 'school-dashboard';

function EnrollmentSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Chargement des effectifs"
      className="space-y-4 p-4"
    >
      <div className="h-8 w-48 animate-pulse rounded-md bg-wa-divider/80" />
      <div className="h-4 w-64 animate-pulse rounded-md bg-wa-divider/80" />
      <div className={cn('h-24 animate-pulse rounded-2xl bg-wa-divider/80')} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-wa-divider/80" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-wa-divider/80" />
    </div>
  );
}

type Props = {
  schoolId: string;
  href?: string;
};

export function EnrollmentLiveView({ schoolId, href = '/school/rapports/effectifs' }: Props) {
  const appData = useAppData();

  const dashboardMeta = useLiveQuery(
    () => getOfflineDb().meta.get(metaKey(schoolId, DASHBOARD_SCOPE)),
    [schoolId],
  );
  const schoolName =
    (dashboardMeta?.value as DashboardPageData | undefined)?.schoolName ?? '';

  const localData = useMemo(
    () => buildEnrollmentFromAppData(appData, schoolName),
    [appData, schoolName],
  );

  const cached = useLiveQuery(
    () => getOfflineDb().meta.get(metaKey(schoolId, ENROLLMENT_META_SCOPE)),
    [schoolId],
  );
  const [fresh, setFresh] = useState<EnrollmentReportData | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/sync/workspace?href=${encodeURIComponent(href.split('#')[0])}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ view: string; data: EnrollmentReportData }>)
          : null,
      )
      .then((payload) => {
        if (!alive || !payload || payload.view !== 'effectifs') return;
        setFresh(payload.data);
        void getOfflineDb().meta.put({
          key: metaKey(schoolId, ENROLLMENT_META_SCOPE),
          school_id: schoolId,
          scope: ENROLLMENT_META_SCOPE,
          value: payload.data,
          updated_at: new Date().toISOString(),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [schoolId, href]);

  const data =
    localData ??
    fresh ??
    (cached?.value as EnrollmentReportData | undefined) ??
    null;

  if (!data) return <EnrollmentSkeleton />;

  return (
    <EnrollmentReportView
      data={data}
      reportsBase={reportsBaseForHref(href)}
    />
  );
}
