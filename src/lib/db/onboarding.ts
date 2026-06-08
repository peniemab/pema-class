import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isAdminApiConfigured } from '@/lib/env';
import { appBaseUrl } from '@/lib/env';
import { generateOpaqueToken, hashToken } from '@/lib/auth/tokens';
import { extractInviteToken } from '@/lib/register/parse-invite';

export type OnboardingTokenRow = {
  id: string;
  school_id: string | null;
  email: string | null;
  internal_note: string | null;
  raw_token: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  draft_school_name: string | null;
};

const onboardingSelect =
  'id, school_id, email, internal_note, raw_token, expires_at, used_at, created_at, draft_school_name';

export type ValidOnboardingToken = {
  tokenId: string;
  draftSchoolName: string;
  expiresAt: string;
};

export type OnboardingInvitePreview = {
  valid: boolean;
  schoolName?: string;
  expiresAt?: string;
  reason?: string;
  rawToken: string;
};

export type OnboardingTokenPreview = {
  ok: boolean;
  schoolName?: string;
  expiresAt?: string;
  reason?: string;
};

export async function createOnboardingToken(input: {
  tokenHash: string;
  rawToken: string;
  expiresAt: Date;
  createdByUserId?: string | null;
  email?: string | null;
  schoolId?: string | null;
  schoolName?: string | null;
  internalNote?: string | null;
}): Promise<OnboardingTokenRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('school_onboarding_tokens')
    .insert({
      token_hash: input.tokenHash,
      raw_token: input.rawToken,
      expires_at: input.expiresAt.toISOString(),
      created_by_user_id: input.createdByUserId ?? null,
      email: input.email?.toLowerCase() ?? null,
      school_id: input.schoolId ?? null,
      draft_school_name: input.schoolName?.trim() || '',
      internal_note: input.internalNote?.trim() || null,
    })
    .select(onboardingSelect)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de créer le lien d'onboarding.");
  }
  return data as OnboardingTokenRow;
}

/** Aperçu invitation pour la page /register (RPC anon, pas de service role). */
export async function getOnboardingInvitePreview(
  rawInput: string,
): Promise<OnboardingInvitePreview> {
  const rawToken = extractInviteToken(rawInput);
  if (!rawToken || rawToken.length < 24) {
    return { valid: false, reason: 'invalid_token', rawToken };
  }

  const peek = await peekOnboardingToken(rawToken);
  if (!peek.ok) {
    return {
      valid: false,
      reason: peek.reason,
      schoolName: peek.schoolName,
      rawToken,
    };
  }

  return {
    valid: true,
    schoolName: peek.schoolName,
    expiresAt: peek.expiresAt,
    rawToken,
  };
}

export async function getValidOnboardingByRawToken(
  rawInput: string,
): Promise<ValidOnboardingToken | null> {
  const raw = extractInviteToken(rawInput);
  if (!raw || raw.length < 24) return null;

  if (!isAdminApiConfigured()) {
    return null;
  }

  try {
    const admin = createAdminClient();
    const tokenHash = hashToken(raw);
    const { data, error } = await admin
      .from('school_onboarding_tokens')
      .select('id, draft_school_name, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error || !data || data.used_at) return null;
    if (new Date(data.expires_at) < new Date()) return null;

    return {
      tokenId: data.id,
      draftSchoolName: data.draft_school_name,
      expiresAt: data.expires_at,
    };
  } catch {
    return null;
  }
}

export async function peekOnboardingToken(
  rawInput: string,
): Promise<OnboardingTokenPreview> {
  const raw = extractInviteToken(rawInput);
  if (!raw || raw.length < 24) {
    return { ok: false, reason: 'invalid_token' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('peek_school_onboarding_token', {
    p_token: raw,
  });

  if (!error && data) {
    const row = data as {
      ok: boolean;
      school_name?: string;
      expires_at?: string;
      reason?: string;
    };
    if (!row.ok) {
      return {
        ok: false,
        reason: row.reason ?? 'not_found',
        schoolName: row.school_name,
      };
    }
    return {
      ok: true,
      schoolName: row.school_name,
      expiresAt: row.expires_at,
    };
  }

  // Repli si la RPC n'existe pas encore (migration 000001 non appliquée).
  if (isAdminApiConfigured()) {
    return peekOnboardingTokenViaAdmin(raw);
  }

  return { ok: false, reason: 'error' };
}

async function peekOnboardingTokenViaAdmin(
  raw: string,
): Promise<OnboardingTokenPreview> {
  try {
    const admin = createAdminClient();
    const tokenHash = hashToken(raw);
    const { data: row, error: dbError } = await admin
      .from('school_onboarding_tokens')
      .select('draft_school_name, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (dbError) return { ok: false, reason: 'error' };
    if (!row || row.used_at) return { ok: false, reason: 'not_found' };
    if (new Date(row.expires_at) < new Date()) {
      return {
        ok: false,
        reason: 'expired',
        schoolName: row.draft_school_name ?? undefined,
      };
    }
    return {
      ok: true,
      schoolName: row.draft_school_name ?? undefined,
      expiresAt: row.expires_at,
    };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function getOnboardingTokenById(
  id: string,
): Promise<OnboardingTokenRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('school_onboarding_tokens')
    .select(onboardingSelect)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return (data as OnboardingTokenRow | null) ?? null;
}

export async function rotateOnboardingToken(input: {
  tokenId: string;
  tokenHash: string;
  rawToken: string;
  expiresAt: Date;
}): Promise<OnboardingTokenRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('school_onboarding_tokens')
    .update({
      token_hash: input.tokenHash,
      raw_token: input.rawToken,
      expires_at: input.expiresAt.toISOString(),
    })
    .eq('id', input.tokenId)
    .is('used_at', null)
    .select(onboardingSelect)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error(
      'Impossible de régénérer ce lien (utilisé, expiré ou introuvable).',
    );
  }
  return data as OnboardingTokenRow;
}

export async function markOnboardingUsed(
  tokenId: string,
  schoolId: string,
): Promise<void> {
  const admin = createAdminClient();
  const patch: {
    used_at: string;
    school_id?: string;
    raw_token?: null;
  } = {
    used_at: new Date().toISOString(),
    school_id: schoolId,
    raw_token: null,
  };
  const { error } = await admin
    .from('school_onboarding_tokens')
    .update(patch)
    .eq('id', tokenId);
  if (error) {
    const { error: fallback } = await admin
      .from('school_onboarding_tokens')
      .update({ used_at: patch.used_at })
      .eq('id', tokenId);
    if (fallback) throw new Error(fallback.message);
  }
}

/** Superadmin : lien `/register?invite=TOKEN` valable 72h. */
export async function createSchoolOnboardingInvite(
  draftSchoolName: string,
  createdByUserId: string,
): Promise<{ inviteUrl: string; expiresAt: string }> {
  const { raw, hash } = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const row = await createOnboardingToken({
    tokenHash: hash,
    rawToken: raw,
    expiresAt,
    createdByUserId,
    schoolName: draftSchoolName,
  });

  const base = appBaseUrl().replace(/\/$/, '');
  return {
    inviteUrl: `${base}/register?invite=${raw}`,
    expiresAt: row.expires_at,
  };
}
