'use server';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  getOnboardingInvitePreview,
  getValidOnboardingByRawToken,
  markOnboardingUsed,
} from '@/lib/db/onboarding';
import { createSchool } from '@/lib/db/schools';
import { createStaff } from '@/lib/db/staff';
import { isAdminApiConfigured } from '@/lib/env';

export type RegisterFormState = {
  ok: boolean;
  error?: string;
};

function buildAddress(parts: {
  commune: string;
  quartier: string;
  avenue: string;
}): string {
  const segments = [
    parts.avenue.trim(),
    parts.quartier.trim() ? `Quartier ${parts.quartier.trim()}` : '',
    parts.commune.trim() ? `Commune ${parts.commune.trim()}` : '',
    'Kinshasa',
  ].filter(Boolean);
  return segments.join(', ');
}

function formatPhone(dialCode: string, number: string): string {
  const digits = number.replace(/\D/g, '');
  const code = dialCode.replace(/\D/g, '');
  return `+${code}${digits}`;
}

export async function registerSchoolAdminAccount(
  _prevState: RegisterFormState | null,
  formData: FormData,
): Promise<RegisterFormState> {
  if (!isAdminApiConfigured()) {
    return {
      ok: false,
      error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).',
    };
  }

  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const dialCode = String(formData.get('dialCode') ?? '+243').trim();
  const phoneNumber = String(formData.get('phoneNumber') ?? '').trim();
  const commune = String(formData.get('commune') ?? '').trim();
  const quartier = String(formData.get('quartier') ?? '').trim();
  const avenue = String(formData.get('avenue') ?? '').trim();
  const discipline = String(formData.get('discipline') ?? '').trim();
  const inviteTokenRaw = String(formData.get('inviteToken') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const consent = formData.get('consent') === 'on';

  if (!firstName || !lastName) {
    return { ok: false, error: 'Le prénom et le nom sont obligatoires.' };
  }
  if (!email) {
    return { ok: false, error: 'L’e-mail est obligatoire.' };
  }
  if (!commune) {
    return { ok: false, error: 'La commune est obligatoire.' };
  }
  if (!discipline) {
    return { ok: false, error: 'Veuillez sélectionner une discipline / domaine.' };
  }
  if (!inviteTokenRaw) {
    return { ok: false, error: 'Le lien ou code d’invitation est obligatoire.' };
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

  const preview = await getOnboardingInvitePreview(inviteTokenRaw);
  if (!preview.valid || !preview.schoolName) {
    return {
      ok: false,
      error:
        preview.reason === 'error'
          ? 'Vérification d’invitation impossible. Appliquez les migrations Supabase ou contactez le support.'
          : 'Lien d’invitation invalide, expiré ou déjà utilisé.',
    };
  }

  const onboarding = await getValidOnboardingByRawToken(inviteTokenRaw);
  if (!onboarding?.draftSchoolName) {
    if (!isAdminApiConfigured()) {
      return {
        ok: false,
        error:
          'SUPABASE_SERVICE_ROLE_KEY manquant sur le serveur : impossible de finaliser l’inscription.',
      };
    }
    return {
      ok: false,
      error: 'Lien d’invitation invalide, expiré ou déjà utilisé.',
    };
  }

  const phone = phoneNumber
    ? formatPhone(dialCode, phoneNumber)
    : null;
  const address = buildAddress({ commune, quartier, avenue });

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      phone,
      commune,
      quartier,
      avenue,
      discipline,
      school_role: 'school_admin',
    },
  });

  if (createError || !created.user) {
    const msg = createError?.message ?? 'Création du compte impossible.';
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
      return { ok: false, error: 'Un compte existe déjà avec cet e-mail.' };
    }
    return { ok: false, error: msg };
  }

  const userId = created.user.id;

  try {
    const school = await createSchool({
      name: onboarding.draftSchoolName,
      phone,
      email,
      address,
    });

    await createStaff({
      schoolId: school.id,
      userId,
      firstName,
      lastName,
      email,
      phone,
      role: 'school_admin',
    });

    await markOnboardingUsed(onboarding.tokenId, school.id);
  } catch (e) {
    await admin.auth.admin.deleteUser(userId);
    const message =
      e instanceof Error ? e.message : 'Erreur lors de la création de l’établissement.';
    return { ok: false, error: message };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      ok: false,
      error:
        'Compte créé, mais la connexion automatique a échoué. Connectez-vous depuis la page d’accueil.',
    };
  }

  redirect('/school');
}
