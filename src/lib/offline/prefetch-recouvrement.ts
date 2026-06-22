import { getOfflineDb } from '@/lib/offline/db';
import type { ImpayesRecouvrementPageData } from '@/lib/db/impayes-page';

export const RECOUVREMENT_META_SCOPE = 'impayes-recouvrement';

function cacheKey(
  schoolId: string,
  feeId: string,
  search?: string,
  classId?: string,
) {
  const q = search ?? '';
  const c = classId ?? '';
  return `${schoolId}:${RECOUVREMENT_META_SCOPE}:${feeId}:${q}:${c}`;
}

const inflight = new Map<string, Promise<ImpayesRecouvrementPageData | null>>();

/** Précharge un recouvrement par frais (ex. cartes scolarité annuelle). */
export function prefetchRecouvrementSnapshot(
  schoolId: string,
  feeId: string,
  filters?: { search?: string; classId?: string },
): void {
  const key = cacheKey(schoolId, feeId, filters?.search, filters?.classId);
  if (inflight.has(key)) return;

  const params = new URLSearchParams({ frais: feeId });
  if (filters?.search) params.set('q', filters.search);
  if (filters?.classId) params.set('classe', filters.classId);

  const promise = fetch(`/api/sync/impayes/recouvrement?${params}`, {
    cache: 'no-store',
    credentials: 'same-origin',
  })
    .then((res) =>
      res.ok ? (res.json() as Promise<ImpayesRecouvrementPageData>) : null,
    )
    .then((data) => {
      if (data) {
        void getOfflineDb().meta.put({
          key,
          school_id: schoolId,
          scope: RECOUVREMENT_META_SCOPE,
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

export { cacheKey as recouvrementCacheKey };
