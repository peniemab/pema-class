'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CashJournalReportView } from '@/components/school/rapports/cash-journal-report-view';
import { getOfflineDb } from '@/lib/offline/db';
import type { CashJournalReportData } from '@/lib/db/finance-reports';
import { todayIsoDate } from '@/lib/date-utils';
import { useAppData } from '@/lib/offline/app-data-context';
import { buildCashJournalFromAppData } from '@/lib/offline/cash-journal-local';
import { cashJournalCacheKey } from '@/lib/offline/prefetch-cash-journal';
import { cn } from '@/lib/utils';

function parseDateFromHref(href: string): string {
  const raw = new URLSearchParams(href.split('?')[1] ?? '').get('date');
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return todayIsoDate();
  return raw;
}

function CashJournalSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement du journal caisse" className="space-y-4 p-4">
      <div className="h-8 w-48 animate-pulse rounded-md bg-wa-divider/80" />
      <div className="h-10 w-full max-w-xs animate-pulse rounded-md bg-wa-divider/80" />
      <div className={cn('h-24 animate-pulse rounded-2xl bg-wa-divider/80')} />
      <div className="h-64 animate-pulse rounded-2xl bg-wa-divider/80" />
    </div>
  );
}

type Props = {
  schoolId: string;
  href: string;
};

export function CashJournalLiveView({ schoolId, href }: Props) {
  const appData = useAppData();
  const [selectedDate, setSelectedDate] = useState(() => parseDateFromHref(href));

  useEffect(() => {
    setSelectedDate(parseDateFromHref(href));
  }, [href]);

  const localData = useMemo(
    () => buildCashJournalFromAppData(appData, selectedDate),
    [appData, selectedDate],
  );

  const cacheKey = cashJournalCacheKey(schoolId, selectedDate);
  const cached = useLiveQuery(
    () => getOfflineDb().meta.get(cacheKey),
    [cacheKey],
  );
  const [fresh, setFresh] = useState<CashJournalReportData | null>(null);

  useEffect(() => {
    let alive = true;
    const syncHref = `/school/rapports/caisse/journal?date=${selectedDate}`;
    fetch(`/api/sync/workspace?href=${encodeURIComponent(syncHref)}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ view: string; data: CashJournalReportData }>)
          : null,
      )
      .then((payload) => {
        if (!alive || !payload || payload.view !== 'cash-journal') return;
        setFresh(payload.data);
        void getOfflineDb().meta.put({
          key: cacheKey,
          school_id: schoolId,
          scope: 'school-cash-journal',
          value: payload.data,
          updated_at: new Date().toISOString(),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [schoolId, selectedDate, cacheKey]);

  const data =
    fresh ??
    (cached?.value as CashJournalReportData | undefined) ??
    localData ??
    null;

  if (!data) return <CashJournalSkeleton />;

  return (
    <CashJournalReportView
      data={data}
      onDateChange={setSelectedDate}
    />
  );
}
