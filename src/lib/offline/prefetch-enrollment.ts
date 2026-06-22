import { getOfflineDb, metaKey } from '@/lib/offline/db';
import type { EnrollmentReportData } from '@/lib/db/finance-reports';

export const ENROLLMENT_META_SCOPE = 'school-enrollment-report';

const inflight = new Map<string, Promise<EnrollmentReportData | null>>();

/** Précharge les effectifs (ex. quand l'onglet Outils est monté). */
export function prefetchEnrollmentSnapshot(schoolId: string): void {
  const key = metaKey(schoolId, ENROLLMENT_META_SCOPE);
  if (inflight.has(key)) return;

  const href = '/school/rapports/effectifs';
  const promise = fetch(
    `/api/sync/workspace?href=${encodeURIComponent(href)}`,
    { cache: 'no-store', credentials: 'same-origin' },
  )
    .then((res) =>
      res.ok
        ? (res.json() as Promise<{ view: string; data: EnrollmentReportData }>)
        : null,
    )
    .then((payload) => {
      const data = payload?.view === 'effectifs' ? payload.data : null;
      if (data) {
        void getOfflineDb().meta.put({
          key,
          school_id: schoolId,
          scope: ENROLLMENT_META_SCOPE,
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
