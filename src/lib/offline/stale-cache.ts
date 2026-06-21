/** Cache sessionStorage stale-while-revalidate (même pattern que bepas-log). */

const CACHE_PREFIX = 'pema-cache:';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type CacheEntry<T> = {
  savedAt: number;
  data: T;
};

export function readStaleCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.savedAt > CACHE_MAX_AGE_MS) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function writeStaleCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry<T> = { savedAt: Date.now(), data };
    sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Quota ou mode privé.
  }
}

export function clearStaleCache(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch {
    // ignore
  }
}

export function staleCacheKey(schoolId: string, scope: string): string {
  return `${schoolId}:${scope}`;
}
