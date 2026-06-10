'use server';

import { revalidatePath } from 'next/cache';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listClassesForYear } from '@/lib/db/classes';
import { createStaffInvitation } from '@/lib/db/invitations';
import { getStaffById } from '@/lib/db/staff';
import { getTeamPageData } from '@/lib/db/team-page';
import {
  saveInvitationTeacherClasses,
  setTeacherClasses,
} from '@/lib/db/teacher-classes';
import {
  INVITABLE_STAFF_ROLES,
  normalizeStaffRole,
  type InvitableStaffRole,
} from '@/lib/auth/types';
import { requireSchoolDirection } from '@/lib/auth/require-role';

export type CreateStaffInviteResult =
  | { ok: true; inviteUrl: string; expiresAt: string }
  | { ok: false; error: string };

export type SaveTeacherClassesResult =
  | { ok: true }
  | { ok: false; error: string };

function parseClassIds(formData: FormData): string[] {
  return formData
    .getAll('classIds')
    .map((value) => String(value).trim())
    .filter(Boolean);
}

async function validateClassIdsForSchool(
  schoolId: string,
  classIds: string[],
): Promise<{ ok: true; academicYearId: string } | { ok: false; error: string }> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) {
    return {
      ok: false,
      error: 'Activez une année scolaire avant d’assigner des classes.',
    };
  }

  if (classIds.length === 0) {
    return { ok: true, academicYearId: activeYear.id };
  }

  const classes = await listClassesForYear(schoolId, activeYear.id);
  const allowed = new Set(classes.map((c) => c.id));
  const invalid = classIds.filter((id) => !allowed.has(id));
  if (invalid.length > 0) {
    return { ok: false, error: 'Une ou plusieurs classes sont invalides.' };
  }

  return { ok: true, academicYearId: activeYear.id };
}

export async function loadTeamPageData() {
  const { schoolId } = await requireSchoolDirection();
  return getTeamPageData(schoolId);
}

export async function createStaffInvite(
  formData: FormData,
): Promise<CreateStaffInviteResult> {
  try {
    const { userId, schoolId } = await requireSchoolDirection();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const roleRaw = String(formData.get('role') ?? '');
    const classIds = parseClassIds(formData);

    if (!email) {
      return { ok: false, error: 'E-mail requis.' };
    }
    if (!(INVITABLE_STAFF_ROLES as readonly string[]).includes(roleRaw)) {
      return { ok: false, error: 'Rôle invalide.' };
    }

    if (roleRaw === 'enseignant' && classIds.length > 0) {
      const validation = await validateClassIdsForSchool(schoolId, classIds);
      if (!validation.ok) return validation;
    }

    const { inviteUrl, expiresAt, invitationId } = await createStaffInvitation({
      schoolId,
      email,
      role: roleRaw as InvitableStaffRole,
      createdByUserId: userId,
    });

    if (roleRaw === 'enseignant' && classIds.length > 0) {
      await saveInvitationTeacherClasses(invitationId, classIds);
    }

    revalidatePath('/school/parametres');
    return { ok: true, inviteUrl, expiresAt };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de créer l'invitation.";
    return { ok: false, error: message };
  }
}

export async function saveTeacherClassesAction(
  _prev: SaveTeacherClassesResult | null,
  formData: FormData,
): Promise<SaveTeacherClassesResult> {
  try {
    const { schoolId } = await requireSchoolDirection();
    const staffId = String(formData.get('staffId') ?? '').trim();
    const classIds = parseClassIds(formData);

    if (!staffId) {
      return { ok: false, error: 'Collaborateur introuvable.' };
    }

    const member = await getStaffById(schoolId, staffId);
    if (!member) {
      return { ok: false, error: 'Collaborateur introuvable.' };
    }
    if (normalizeStaffRole(member.role) !== 'enseignant') {
      return { ok: false, error: 'Seuls les enseignants peuvent recevoir des classes.' };
    }

    const validation = await validateClassIdsForSchool(schoolId, classIds);
    if (!validation.ok) return validation;

    await setTeacherClasses({
      staffId,
      academicYearId: validation.academicYearId,
      classIds,
    });

    revalidatePath('/school/parametres');
    revalidatePath('/school/presences');
    revalidatePath('/app/presences');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Impossible de sauvegarder les classes.';
    return { ok: false, error: message };
  }
}
