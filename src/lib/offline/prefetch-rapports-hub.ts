import { getOfflineDb, metaKey } from '@/lib/offline/db';

export const RAPPORTS_HUB_META_SCOPE = 'school-rapports-hub';

const inflight = new Map<string, Promise<void>>();

/** Précharge l'aperçu du hub rapports. */
export function prefetchRapportsHubSnapshot(schoolId: string): void {
  const key = metaKey(schoolId, RAPPORTS_HUB_META_SCOPE);
  if (inflight.has(key)) return;

  const href = '/school/rapports';
  const promise = fetch(
    `/api/sync/workspace?href=${encodeURIComponent(href)}`,
    { cache: 'no-store', credentials: 'same-origin' },
  )
    .then((res) => (res.ok ? res.json() : null))
    .then((payload) => {
      if (payload?.view === 'rapports-hub' && payload.data) {
        void getOfflineDb().meta.put({
          key,
          school_id: schoolId,
          scope: RAPPORTS_HUB_META_SCOPE,
          value: payload.data,
          updated_at: new Date().toISOString(),
        });
      }
    })
    .catch(() => {})
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
}
