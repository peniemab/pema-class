'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ATTENDANCE_ROLES,
  ENROLLMENT_ROLES,
  FINANCE_ROLES,
  OFFICE_STAFF_ROLES,
  type StaffRole,
} from '@/lib/auth/types';
import {
  getOfflineDb,
  type LocalAttendance,
  type LocalClass,
  type LocalFee,
  type LocalPayment,
  type LocalStudent,
} from '@/lib/offline/db';
import {
  attendanceSnapshotToLocalRows,
  attendanceSnapshotToSyncState,
  readAttendanceSyncState,
  saveAttendanceSnapshot,
  type AttendanceSyncState,
} from '@/lib/offline/attendance-repo';
import {
  caissePaintFromSnapshot,
  readCaisseSyncState,
  saveCaisseSnapshot,
  type CaisseSyncState,
} from '@/lib/offline/caisse-repo';
import {
  readStudentsSyncState,
  saveStudentsSnapshot,
  studentsPaintFromSnapshot,
  type StudentsSyncState,
} from '@/lib/offline/students-repo';
import { countPendingOutbox } from '@/lib/offline/outbox-repo';
import { pushOutbox } from '@/lib/offline/push-outbox';
import {
  type RefreshOptions,
  type SyncPhase,
  scheduleBackgroundWork,
} from '@/lib/offline/silent-sync';
import type { AttendanceSnapshot } from '@/lib/offline/attendance-snapshot';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';

export type AppDataValue = {
  schoolId: string;
  staffId: string;
  role: StaffRole;

  students: LocalStudent[];
  classes: LocalClass[];
  fees: LocalFee[];
  payments: LocalPayment[];
  attendance: LocalAttendance[];

  studentsState: StudentsSyncState | null;
  caisseState: CaisseSyncState | null;
  attendanceState: AttendanceSyncState | null;

  phase: SyncPhase;
  online: boolean;
  pendingCount: number;
  refresh: (options?: RefreshOptions) => void;

  /** true tant qu'aucune donnée (ni snapshot serveur, ni cache Dexie) n'existe. */
  hydrating: boolean;
};

const AppDataContext = createContext<AppDataValue | null>(null);

type Caps = { students: boolean; caisse: boolean; presences: boolean };

function capsForRole(role: StaffRole): Caps {
  const students =
    ENROLLMENT_ROLES.includes(role) && OFFICE_STAFF_ROLES.includes(role);
  return {
    students,
    caisse: FINANCE_ROLES.includes(role),
    presences: ATTENDANCE_ROLES.includes(role),
  };
}

function caisseSeedRows(snapshot: CaisseSnapshot | null): {
  fees: LocalFee[];
  payments: LocalPayment[];
  students: LocalStudent[];
} {
  if (!snapshot) return { fees: [], payments: [], students: [] };
  return {
    fees: snapshot.fees.map((f) => ({
      id: f.id,
      school_id: f.school_id,
      name: f.name,
      amount: Number(f.amount),
      currency: f.currency,
      academic_year: f.academic_year,
    })),
    payments: snapshot.payments.map((p) => ({
      id: p.id,
      school_id: snapshot.schoolId,
      student_id: p.student_id,
      fee_id: p.fee_id,
      fee_name: p.fee_name,
      amount_paid: Number(p.amount_paid),
      currency: p.currency,
      receipt_number: p.receipt_number,
      created_at: p.created_at,
      sync_status: 'synced',
    })),
    students: snapshot.students.map((s) => ({
      id: s.id,
      school_id: snapshot.schoolId,
      first_name: s.first_name,
      last_name: s.last_name,
      matricule: s.matricule,
      gender: s.gender,
      birth_date: s.birth_date,
      status: s.status,
      class_id: s.class_id,
      class_name: s.class_name,
      class_level: s.class_level,
      class_cycle: s.class_cycle,
      sync_status: 'synced',
      updated_at: snapshot.generatedAt,
    })),
  };
}

async function pullJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Sync HTTP ${res.status}`);
  return (await res.json()) as T;
}

type Props = {
  schoolId: string;
  staffId: string;
  role: StaffRole;
  studentsSnapshot: StudentsSnapshot | null;
  caisseSnapshot: CaisseSnapshot | null;
  attendanceSnapshot: AttendanceSnapshot | null;
  children: React.ReactNode;
};

/**
 * Magasin unique (style WhatsApp) : données chargées UNE fois au niveau du
 * workspace. Peinture instantanée depuis les snapshots serveur, lecture
 * réactive Dexie (mutations hors ligne), rafraîchissement silencieux en fond.
 * Monté au-dessus des onglets → ne se démonte jamais lors d'un changement
 * d'onglet, donc les données restent toujours en place.
 */
export function AppDataProvider({
  schoolId,
  staffId,
  role,
  studentsSnapshot,
  caisseSnapshot,
  attendanceSnapshot,
  children,
}: Props) {
  // Un domaine est rafraîchissable si le rôle le permet OU si un snapshot
  // serveur a été fourni (cas des routes autonomes /school/* pour la direction).
  const caps = useMemo(() => {
    const base = capsForRole(role);
    return {
      students: base.students || base.presences || studentsSnapshot != null,
      caisse: base.caisse || caisseSnapshot != null,
      presences: base.presences || attendanceSnapshot != null,
    };
  }, [role, studentsSnapshot, caisseSnapshot, attendanceSnapshot]);

  // --- Graines (seeds) calculées une seule fois depuis le SSR. ---
  const seeds = useMemo(() => {
    const fromStudents = studentsSnapshot
      ? studentsPaintFromSnapshot(studentsSnapshot)
      : null;
    const fromCaisse = caisseSeedRows(caisseSnapshot);

    const students =
      fromStudents?.students ??
      (fromCaisse.students.length ? fromCaisse.students : []);
    const classes = fromStudents?.classes ?? [];
    const attendance = attendanceSnapshot
      ? attendanceSnapshotToLocalRows(attendanceSnapshot)
      : [];

    return {
      students,
      classes,
      fees: fromCaisse.fees,
      payments: fromCaisse.payments,
      attendance,
      studentsState: fromStudents?.state ?? null,
      caisseState: caisseSnapshot
        ? caissePaintFromSnapshot(caisseSnapshot)
        : null,
      attendanceState: attendanceSnapshot
        ? attendanceSnapshotToSyncState(attendanceSnapshot)
        : null,
    };
  }, [studentsSnapshot, caisseSnapshot, attendanceSnapshot]);

  const [phase, setPhase] = useState<SyncPhase>('idle');
  const [online, setOnline] = useState(true);
  const syncInFlightRef = useRef(false);

  // --- Lecture réactive Dexie (jamais undefined : seedée). ---
  const liveStudents = useLiveQuery(
    () => getOfflineDb().students.where('school_id').equals(schoolId).toArray(),
    [schoolId],
    seeds.students,
  );
  const liveClasses = useLiveQuery(
    () => getOfflineDb().classes.where('school_id').equals(schoolId).toArray(),
    [schoolId],
    seeds.classes,
  );
  const liveFees = useLiveQuery(
    () => getOfflineDb().fees.where('school_id').equals(schoolId).toArray(),
    [schoolId],
    seeds.fees,
  );
  const livePayments = useLiveQuery(
    () => getOfflineDb().payments.where('school_id').equals(schoolId).toArray(),
    [schoolId],
    seeds.payments,
  );
  const liveAttendance = useLiveQuery(
    () =>
      getOfflineDb().attendance.where('school_id').equals(schoolId).toArray(),
    [schoolId],
    seeds.attendance,
  );

  const liveStudentsState = useLiveQuery(
    () => readStudentsSyncState(schoolId),
    [schoolId],
    seeds.studentsState,
  );
  const liveCaisseState = useLiveQuery(
    () => readCaisseSyncState(schoolId),
    [schoolId],
    seeds.caisseState,
  );
  const liveAttendanceState = useLiveQuery(
    () => readAttendanceSyncState(schoolId),
    [schoolId],
    seeds.attendanceState,
  );
  const pendingCount = useLiveQuery(
    () => countPendingOutbox(schoolId),
    [schoolId],
    0,
  );

  // Dexie froid (résolu mais vide) → on garde la graine serveur le temps
  // que la sync remplisse la base.
  const students = liveStudents.length ? liveStudents : seeds.students;
  const classes = liveClasses.length ? liveClasses : seeds.classes;
  const fees = liveFees.length ? liveFees : seeds.fees;
  const payments = livePayments.length ? livePayments : seeds.payments;
  const attendance = liveAttendance.length ? liveAttendance : seeds.attendance;

  const studentsState = liveStudentsState ?? seeds.studentsState;
  const caisseState = liveCaisseState ?? seeds.caisseState;
  const attendanceState = liveAttendanceState ?? seeds.attendanceState;

  const hasAnyState = Boolean(
    studentsState || caisseState || attendanceState,
  );
  const hasAnyData =
    students.length > 0 ||
    fees.length > 0 ||
    payments.length > 0 ||
    attendance.length > 0;
  const hydrating = !hasAnyState && !hasAnyData;

  // --- Écrit les snapshots serveur dans Dexie (persistance hors ligne). ---
  useEffect(() => {
    if (studentsSnapshot) void saveStudentsSnapshot(studentsSnapshot);
  }, [studentsSnapshot]);
  useEffect(() => {
    if (caisseSnapshot) void saveCaisseSnapshot(caisseSnapshot);
  }, [caisseSnapshot]);
  useEffect(() => {
    if (attendanceSnapshot) void saveAttendanceSnapshot(attendanceSnapshot);
  }, [attendanceSnapshot]);

  const hasLocalCache = hasAnyState || hasAnyData;

  const refresh = useCallback(
    (options?: RefreshOptions) => {
      const visible = options?.visible === true;

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (!hasLocalCache) setPhase('error');
        return;
      }
      if (syncInFlightRef.current) return;
      syncInFlightRef.current = true;
      if (visible) setPhase('syncing');

      const run = async () => {
        await pushOutbox(schoolId);
        const tasks: Promise<void>[] = [];
        if (caps.students) {
          tasks.push(
            pullJson<StudentsSnapshot>('/api/sync/students').then((snap) =>
              saveStudentsSnapshot(snap),
            ),
          );
        }
        if (caps.caisse) {
          tasks.push(
            pullJson<CaisseSnapshot>('/api/sync/caisse').then((snap) =>
              saveCaisseSnapshot(snap),
            ),
          );
        }
        if (caps.presences) {
          tasks.push(
            pullJson<AttendanceSnapshot>('/api/sync/attendance').then((snap) =>
              saveAttendanceSnapshot(snap),
            ),
          );
        }
        await Promise.all(tasks);
      };

      run()
        .then(() => setPhase('idle'))
        .catch(() => {
          if (!hasLocalCache || visible) setPhase('error');
        })
        .finally(() => {
          syncInFlightRef.current = false;
        });
    },
    [schoolId, caps, hasLocalCache],
  );

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      scheduleBackgroundWork(() => refresh());
    };
    const goOffline = () => {
      setOnline(false);
      if (hasLocalCache) setPhase('idle');
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [refresh, hasLocalCache]);

  // Une seule sync de fond au démarrage du workspace.
  useEffect(() => {
    const cancel = scheduleBackgroundWork(() => refresh());
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const value = useMemo<AppDataValue>(
    () => ({
      schoolId,
      staffId,
      role,
      students,
      classes,
      fees,
      payments,
      attendance,
      studentsState,
      caisseState,
      attendanceState,
      phase,
      online,
      pendingCount: pendingCount ?? 0,
      refresh,
      hydrating,
    }),
    [
      schoolId,
      staffId,
      role,
      students,
      classes,
      fees,
      payments,
      attendance,
      studentsState,
      caisseState,
      attendanceState,
      phase,
      online,
      pendingCount,
      refresh,
      hydrating,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData doit être utilisé dans un AppDataProvider.');
  }
  return ctx;
}
