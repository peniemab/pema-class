'use server';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  acceptStaffInvitation,
  extractStaffInviteToken,
  getValidStaffInvitationByToken,
  isAcceptStaffInvitationMissingError,
} from '@/lib/db/invitations';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { getStaffByUserId } from '@/lib/db/staff';
import { applyInvitationTeacherClasses } from '@/lib/db/teacher-classes';
import {
  getRoleHomePath,
  normalizeStaffRole,
  type StaffRole,
} from '@/lib/auth/types';
import { isAdminApiConfigured } from '@/lib/env';

export type StaffJoinFormState = {
  ok: boolean;
  error?: string;
};

export async function registerStaffFromInvitation(
  _prev: StaffJoinFormState | null,
  formData: FormData,
): Promise<StaffJoinFormState> {
  if (!isAdminApiConfigured()) {
    return {
      ok: false,
      error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).',
    };
  }

  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const inviteRaw = String(formData.get('inviteToken') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const consent = formData.get('consent') === 'on';

  if (!firstName || !lastName) {
    return { ok: false, error: 'Le prénom et le nom sont obligatoires.' };
  }
  if (!email) {
    return { ok: false, error: 'L’e-mail est obligatoire.' };
  }
  if (!inviteRaw) {
    return { ok: false, error: 'Le lien d’invitation est obligatoire.' };
  }
  if (password.length < 8) {
    return {
      ok: false,
      error: 'Le mot de passe doit contenir au moins 8 caractères.',
    };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'Les mots de passe ne correspondent pas.' };
  }
  if (!consent) {
    return {
      ok: false,
      error: 'Vous devez accepter les conditions générales d’utilisation.',
    };
  }

  const token = extractStaffInviteToken(inviteRaw);
  const invitation = await getValidStaffInvitationByToken(token);
  if (!invitation) {
    return {
      ok: false,
      error: 'Invitation invalide, expirée ou déjà utilisée.',
    };
  }

  if (invitation.email && invitation.email.toLowerCase() !== email) {
    return {
      ok: false,
      error: 'Utilisez l’e-mail indiqué dans l’invitation.',
    };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (createError || !created.user) {
    const msg = createError?.message ?? 'Création du compte impossible.';
    if (
      msg.toLowerCase().includes('already') ||
      msg.toLowerCase().includes('registered')
    ) {
      return { ok: false, error: 'Un compte existe déjà avec cet e-mail.' };
    }
    return { ok: false, error: msg };
  }

  const userId = created.user.id;
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      error: 'Connexion impossible après création du compte.',
    };
  }

  try {
    await acceptStaffInvitation({
      token,
      firstName,
      lastName,
    });

    const staff = await getStaffByUserId(userId);
    if (
      staff &&
      normalizeStaffRole(invitation.role) === 'enseignant'
    ) {
      const activeYear = await getActiveAcademicYear(invitation.school_id);
      if (activeYear) {
        await applyInvitationTeacherClasses({
          invitationId: invitation.id,
          staffId: staff.id,
          academicYearId: activeYear.id,
        });
      }
    }
  } catch (e) {
    await admin.auth.admin.deleteUser(userId);
    await supabase.auth.signOut();
    const message =
      e instanceof Error ? e.message : 'Impossible de rejoindre l’établissement.';
    if (message.includes('email_mismatch')) {
      return { ok: false, error: 'L’e-mail ne correspond pas à l’invitation.' };
    }
    if (message.includes('already_member')) {
      return { ok: false, error: 'Vous appartenez déjà à cet établissement.' };
    }
    if (isAcceptStaffInvitationMissingError(message)) {
      return {
        ok: false,
        error:
          'Fonction accept_staff_invitation absente. Exécutez la migration supabase/migrations/20260525000002_staff_invitation_rpc.sql sur Supabase.',
      };
    }
    return { ok: false, error: message };
  }

  const role = normalizeStaffRole(invitation.role) as StaffRole;
  redirect(getRoleHomePath(role));
}
