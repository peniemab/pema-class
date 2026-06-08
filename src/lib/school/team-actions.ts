'use server';

import { revalidatePath } from 'next/cache';
import {
  INVITABLE_STAFF_ROLES,
  type InvitableStaffRole,
} from '@/lib/auth/types';
import { requireSchoolDirection } from '@/lib/auth/require-role';
import { createStaffInvitation } from '@/lib/db/invitations';

export type CreateStaffInviteResult =
  | { ok: true; inviteUrl: string; expiresAt: string }
  | { ok: false; error: string };

export async function createStaffInvite(
  formData: FormData,
): Promise<CreateStaffInviteResult> {
  try {
    const { userId, schoolId } = await requireSchoolDirection();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const roleRaw = String(formData.get('role') ?? '');

    if (!email) {
      return { ok: false, error: 'E-mail requis.' };
    }
    if (!(INVITABLE_STAFF_ROLES as readonly string[]).includes(roleRaw)) {
      return { ok: false, error: 'Rôle invalide.' };
    }

    const { inviteUrl, expiresAt } = await createStaffInvitation({
      schoolId,
      email,
      role: roleRaw as InvitableStaffRole,
      createdByUserId: userId,
    });

    revalidatePath('/school/team');
    return { ok: true, inviteUrl, expiresAt };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de créer l'invitation.";
    return { ok: false, error: message };
  }
}
