import { getOfflineDb, metaKey } from '@/lib/offline/db';
import type { ImpayesPageData } from '@/lib/db/impayes-page';

export const IMPAYES_META_SCOPE = 'school-impayes';

let inflight: Promise<ImpayesPageData | null> | null = null;

/** Précharge les impayés en arrière-plan (ex. quand l'onglet Outils est monté). */
export function prefetchImpayesSnapshot(schoolId: string): void {
  if (inflight) return;
  inflight = fetch('/api/sync/impayes', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
    .then((res) => (res.ok ? (res.json() as Promise<ImpayesPageData>) : null))
    .then((data) => {
      if (data) {
        void getOfflineDb().meta.put({
          key: metaKey(schoolId, IMPAYES_META_SCOPE),
          school_id: schoolId,
          scope: IMPAYES_META_SCOPE,
          value: data,
          updated_at: new Date().toISOString(),
        });
      }
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
}
