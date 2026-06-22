import { getOfflineDb } from '@/lib/offline/db';
import type { CashJournalReportData } from '@/lib/db/finance-reports';
import { todayIsoDate } from '@/lib/date-utils';

export const CASH_JOURNAL_META_SCOPE = 'school-cash-journal';

function cacheKey(schoolId: string, date: string) {
  return `${schoolId}:${CASH_JOURNAL_META_SCOPE}:${date}`;
}

const inflight = new Map<string, Promise<CashJournalReportData | null>>();

/** Précharge le journal du jour (ex. quand l'onglet Outils est monté). */
export function prefetchCashJournalSnapshot(
  schoolId: string,
  date: string = todayIsoDate(),
): void {
  const key = cacheKey(schoolId, date);
  if (inflight.has(key)) return;

  const href = `/school/rapports/caisse/journal?date=${date}`;
  const promise = fetch(
    `/api/sync/workspace?href=${encodeURIComponent(href)}`,
    { cache: 'no-store', credentials: 'same-origin' },
  )
    .then((res) =>
      res.ok
        ? (res.json() as Promise<{ view: string; data: CashJournalReportData }>)
        : null,
    )
    .then((payload) => {
      const data = payload?.view === 'cash-journal' ? payload.data : null;
      if (data) {
        void getOfflineDb().meta.put({
          key,
          school_id: schoolId,
          scope: CASH_JOURNAL_META_SCOPE,
          value: data,
          updated_at: new Date().toISOString(),
        });
      }
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
}

export { cacheKey as cashJournalCacheKey };
