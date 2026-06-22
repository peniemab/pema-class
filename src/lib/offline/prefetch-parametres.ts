import { getOfflineDb, metaKey } from '@/lib/offline/db';

export const PARAMETRES_META_SCOPE = 'school-parametres';

const inflight = new Map<string, Promise<void>>();

/** Précharge les paramètres (ex. quand l'onglet Outils est monté). */
export function prefetchParametresSnapshot(schoolId: string): void {
  const key = metaKey(schoolId, PARAMETRES_META_SCOPE);
  if (inflight.has(key)) return;

  const href = '/school/parametres';
  const promise = fetch(
    `/api/sync/workspace?href=${encodeURIComponent(href)}`,
    { cache: 'no-store', credentials: 'same-origin' },
  )
    .then((res) => (res.ok ? res.json() : null))
    .then((payload) => {
      if (payload?.view === 'parametres' && payload.data) {
        void getOfflineDb().meta.put({
          key,
          school_id: schoolId,
          scope: PARAMETRES_META_SCOPE,
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
