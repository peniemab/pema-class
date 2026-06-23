import { getRoleHomePath, type StaffRole } from '@/lib/auth/types';
import type { StaffDashboardPageData } from '@/lib/school/load-staff-dashboard-page';

export const LOCAL_SESSION_KEY = 'pema-local-session';
export const LOCAL_SESSION_VERSION = 1 as const;
/** Cookie lu par le middleware pour laisser passer /app et /school hors ligne. */
export const OFFLINE_BOOT_COOKIE = 'pema-offline-boot';
const BOOT_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 400; // ~13 mois
export const WORKSPACE_SHELL_CACHE = 'pema-workspace-shell';

export type LocalSession = {
  version: typeof LOCAL_SESSION_VERSION;
  userId: string;
  staffId: string;
  schoolId: string;
  role: StaffRole;
  homePath: string;
  email?: string;
  schoolName?: string;
  staffDashboard?: StaffDashboardPageData;
  savedAt: string;
};

export type LocalSessionInput = Omit<LocalSession, 'version' | 'savedAt'> & {
  savedAt?: string;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/** Cookie Supabase présent (refresh token) — requis en ligne pour faire confiance à la session locale. */
export function hasSupabaseAuthCookie(): boolean {
  if (!isBrowser()) return false;
  return document.cookie.split(';').some((c) => c.trim().includes('-auth-token'));
}

export function readLocalSession(): LocalSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSession;
    if (parsed.version !== LOCAL_SESSION_VERSION) return null;
    if (
      !parsed.userId ||
      !parsed.staffId ||
      !parsed.schoolId ||
      !parsed.role ||
      !parsed.homePath
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalSession(input: LocalSessionInput): void {
  if (!isBrowser()) return;
  const session: LocalSession = {
    version: LOCAL_SESSION_VERSION,
    savedAt: input.savedAt ?? new Date().toISOString(),
    userId: input.userId,
    staffId: input.staffId,
    schoolId: input.schoolId,
    role: input.role,
    homePath: input.homePath,
    email: input.email,
    schoolName: input.schoolName,
    staffDashboard: input.staffDashboard,
  };
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    document.cookie = `${OFFLINE_BOOT_COOKIE}=1; path=/; max-age=${BOOT_COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
  } catch {
    /* quota dépassé — non bloquant */
  }
}

export function clearLocalSession(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    document.cookie = `${OFFLINE_BOOT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    void clearWorkspaceShellCache();
  } catch {
    /* ignore */
  }
}

export async function clearWorkspaceShellCache(): Promise<void> {
  if (!isBrowser() || !('caches' in window)) return;
  await caches.delete(WORKSPACE_SHELL_CACHE);
}

/** Session locale utilisable : cookie auth OU appareil hors ligne. */
export function canTrustLocalSession(session: LocalSession | null): session is LocalSession {
  if (!session) return false;
  if (hasSupabaseAuthCookie()) return true;
  if (isBrowser() && !navigator.onLine) return true;
  return false;
}

export function syncBootCookieFromLocalSession(): void {
  if (!isBrowser() || !readLocalSession()) return;
  document.cookie = `${OFFLINE_BOOT_COOKIE}=1; path=/; max-age=${BOOT_COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

export function homePathForRole(role: StaffRole): string {
  return getRoleHomePath(role);
}

export function emptyStaffDashboard(schoolName = 'Établissement'): StaffDashboardPageData {
  return {
    schoolName,
    activeYear: null,
    enrolledCount: 0,
    classCount: 0,
    studentsWithDebt: 0,
    feeCurrencies: [],
    totalCollectedCdf: 0,
    totalCollectedUsd: 0,
    totalExpectedCdf: 0,
    totalExpectedUsd: 0,
    totalUnpaidCdf: 0,
    totalUnpaidUsd: 0,
    recoveryRateCdf: 0,
    recoveryRateUsd: 0,
    teacherClassCount: undefined,
    teacherStudentsWithDebt: undefined,
  };
}
