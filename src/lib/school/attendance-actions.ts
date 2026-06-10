'use server';

import { revalidatePath } from 'next/cache';
import { ATTENDANCE_STATUSES, type AttendanceStatus, upsertAttendancesBatch } from '@/lib/db/attendances';
import { getAttendancePageData } from '@/lib/db/attendance-page';
import { getStaffByUserId } from '@/lib/db/staff';
import { requireSession } from '@/lib/auth/require-role';
import {
  ATTENDANCE_ROLES,
  normalizeStaffRole,
  SCHOOL_DIRECTION_ROLES,
} from '@/lib/auth/types';

export type SaveAttendanceResult =
  | { ok: true; saved: number }
  | { ok: false; error: string };

type AttendanceScope = {
  userId: string;
  schoolId: string;
  staffId: string;
  role: ReturnType<typeof normalizeStaffRole>;
};

async function requireAttendanceAccess(): Promise<AttendanceScope> {
  const { userId } = await requireSession();
  const staff = await getStaffByUserId(userId);
  if (!staff?.school_id || staff.status !== 'active' || !staff.is_active) {
    throw new Error('Accès refusé.');
  }
  const role = normalizeStaffRole(staff.role);
  if (!ATTENDANCE_ROLES.includes(role)) {
    throw new Error('Accès refusé.');
  }
  return {
    userId,
    schoolId: staff.school_id,
    staffId: staff.id,
    role,
  };
}

function revalidatePresences(basePath: '/school/presences' | '/app/presences') {
  revalidatePath(basePath);
  revalidatePath('/school');
}

export async function loadAttendancePage(
  searchParams: Record<string, string | undefined>,
  basePath: '/school/presences' | '/app/presences',
) {
  const { schoolId, staffId, role } = await requireAttendanceAccess();

  if (
    basePath === '/school/presences' &&
    !SCHOOL_DIRECTION_ROLES.includes(role)
  ) {
    throw new Error('Accès refusé.');
  }

  return getAttendancePageData(schoolId, staffId, role, searchParams);
}

export async function saveAttendanceAction(input: {
  classId: string;
  date: string;
  entries: { studentId: string; status: AttendanceStatus }[];
  basePath: '/school/presences' | '/app/presences';
}): Promise<SaveAttendanceResult> {
  try {
    const { staffId, role } = await requireAttendanceAccess();

    if (
      input.basePath === '/school/presences' &&
      !SCHOOL_DIRECTION_ROLES.includes(role)
    ) {
      return { ok: false, error: 'Accès refusé.' };
    }

    if (!input.classId?.trim()) {
      return { ok: false, error: 'Classe requise.' };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      return { ok: false, error: 'Date invalide.' };
    }
    if (input.entries.length === 0) {
      return { ok: false, error: 'Aucun élève à enregistrer.' };
    }

    for (const entry of input.entries) {
      if (!(ATTENDANCE_STATUSES as readonly string[]).includes(entry.status)) {
        return { ok: false, error: 'Statut invalide.' };
      }
    }

    await upsertAttendancesBatch(
      input.entries.map((e) => ({
        studentId: e.studentId,
        classId: input.classId,
        date: input.date,
        status: e.status,
        recordedBy: staffId,
      })),
    );

    revalidatePresences(input.basePath);
    return { ok: true, saved: input.entries.length };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Enregistrement impossible.',
    };
  }
}
