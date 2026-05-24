'use server';

import { revalidatePath } from 'next/cache';
import { generateOpaqueToken } from '@/lib/auth/tokens';
import type { SchoolStatus } from '@/lib/auth/types';
import { requireSuperadmin } from '@/lib/auth/require-role';
import {
  createOnboardingToken,
  getOnboardingTokenById,
  rotateOnboardingToken,
} from '@/lib/db/onboarding';
import { buildOnboardingUrl } from '@/lib/platform/onboarding-url';
import {
  directorNeedsOnboarding,
  getPlatformSchoolById,
  updateSchoolStatus,
} from '@/lib/db/platform';

export type GenerateOnboardingLinkResult =
  | { ok: true; onboardingUrl: string; expiresAt: string }
  | { ok: false; error: string };

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Superadmin : nouveau lien (école créée à l'inscription). */
export async function generateOnboardingLink(input?: {
  schoolName?: string;
  internalNote?: string;
}): Promise<GenerateOnboardingLinkResult> {
  try {
    const { userId } = await requireSuperadmin();
    const schoolName = input?.schoolName?.trim();
    if (!schoolName) {
      return { ok: false, error: "Le nom de l'établissement est requis." };
    }

    const { raw, hash } = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const row = await createOnboardingToken({
      tokenHash: hash,
      rawToken: raw,
      expiresAt,
      createdByUserId: userId,
      schoolName,
      internalNote: input?.internalNote,
    });

    revalidatePath('/platform/onboarding');
    revalidatePath('/platform');

    return {
      ok: true,
      onboardingUrl: buildOnboardingUrl(raw),
      expiresAt: row.expires_at,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la génération.';
    return { ok: false, error: message };
  }
}

/** @deprecated Utiliser generateOnboardingLink */
export async function createDirectorInvite(
  schoolName: string,
): Promise<
  | { ok: true; inviteUrl: string; expiresAt: string }
  | { ok: false; error: string }
> {
  const result = await generateOnboardingLink({ schoolName });
  if (!result.ok) return result;
  return {
    ok: true,
    inviteUrl: result.onboardingUrl,
    expiresAt: result.expiresAt,
  };
}

export async function setSchoolStatusAction(
  schoolId: string,
  status: SchoolStatus,
): Promise<ActionResult> {
  try {
    await requireSuperadmin();
    await updateSchoolStatus(schoolId, status);
    revalidatePath('/platform');
    revalidatePath('/platform/schools');
    revalidatePath(`/platform/schools/${schoolId}`);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Action impossible.';
    return { ok: false, error: message };
  }
}

export async function regenerateSchoolOnboardingLink(
  schoolId: string,
): Promise<GenerateOnboardingLinkResult> {
  try {
    const { userId } = await requireSuperadmin();
    const school = await getPlatformSchoolById(schoolId);
    if (!school) {
      return { ok: false, error: 'Établissement introuvable.' };
    }

    const needsLink = await directorNeedsOnboarding(schoolId);
    if (!needsLink && school.director?.user_id) {
      return {
        ok: false,
        error: 'Le directeur est déjà inscrit — aucun lien à régénérer.',
      };
    }

    const { raw, hash } = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const row = await createOnboardingToken({
      tokenHash: hash,
      rawToken: raw,
      expiresAt,
      createdByUserId: userId,
      email: school.director?.email ?? null,
      schoolId,
      schoolName: school.name,
    });

    revalidatePath(`/platform/schools/${schoolId}`);
    revalidatePath('/platform/onboarding');

    return {
      ok: true,
      onboardingUrl: buildOnboardingUrl(raw),
      expiresAt: row.expires_at,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la génération.';
    return { ok: false, error: message };
  }
}

export async function rotateOnboardingTokenAction(
  tokenId: string,
): Promise<GenerateOnboardingLinkResult> {
  try {
    await requireSuperadmin();
    const existing = await getOnboardingTokenById(tokenId);
    if (!existing) {
      return { ok: false, error: 'Lien introuvable.' };
    }
    if (existing.used_at) {
      return { ok: false, error: 'Ce lien a déjà été utilisé.' };
    }

    const { raw, hash } = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const row = await rotateOnboardingToken({
      tokenId,
      tokenHash: hash,
      rawToken: raw,
      expiresAt,
    });

    revalidatePath('/platform/onboarding');
    revalidatePath('/platform');

    return {
      ok: true,
      onboardingUrl: buildOnboardingUrl(raw),
      expiresAt: row.expires_at,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur lors de la régénération.';
    return { ok: false, error: message };
  }
}
