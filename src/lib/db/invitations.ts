import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { InvitableStaffRole } from '@/lib/auth/types';
import { generateOpaqueToken } from '@/lib/auth/tokens';
import { appBaseUrl, isAdminApiConfigured } from '@/lib/env';

export type StaffInvitePreview = {
  ok: boolean;
  inviteType?: string;
  schoolName?: string | null;
  role?: string | null;
  email?: string | null;
  reason?: string;
};

export type StaffInvitationRow = {
  id: string;
  token: string;
  school_id: string;
  role: string;
  email: string | null;
  expires_at: string;
  used_at: string | null;
};

const MIN_STAFF_TOKEN_LENGTH = 16;

/** Aperçu invitation staff pour /join (RPC anon, repli service role). */
export async function peekStaffInvitation(
  token: string,
): Promise<StaffInvitePreview> {
  const raw = token.trim();
  if (!raw || raw.length < MIN_STAFF_TOKEN_LENGTH) {
    return { ok: false, reason: 'invalid_token' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('peek_invitation', {
    p_token: raw,
  });

  if (!error && data) {
    const row = data as {
      ok: boolean;
      invite_type?: string;
      school_name?: string | null;
      role?: string | null;
      reason?: string;
    };
    if (!row.ok) {
      return {
        ok: false,
        reason: row.reason ?? 'not_found',
        schoolName: row.school_name ?? null,
        role: row.role ?? null,
      };
    }
    if (row.invite_type !== 'staff_join') {
      return { ok: false, reason: 'wrong_invite_type' };
    }

    const email = isAdminApiConfigured()
      ? await getStaffInviteEmailByToken(raw)
      : null;

    return {
      ok: true,
      inviteType: row.invite_type,
      schoolName: row.school_name ?? null,
      role: row.role ?? null,
      email,
    };
  }

  if (isAdminApiConfigured()) {
    return peekStaffInvitationViaAdmin(raw);
  }

  return { ok: false, reason: 'error' };
}

async function peekStaffInvitationViaAdmin(
  raw: string,
): Promise<StaffInvitePreview> {
  try {
    const admin = createAdminClient();
    const { data: inv, error: invError } = await admin
      .from('invitations')
      .select(
        'invite_type, role, email, expires_at, used_at, school_id, schools(name)',
      )
      .eq('token', raw)
      .maybeSingle();

    if (invError) return { ok: false, reason: 'error' };
    if (!inv || inv.used_at) return { ok: false, reason: 'not_found' };

    const inviteType = inv.invite_type as string;
    const schoolJoin = inv.schools as { name?: string } | null;
    const schoolName = schoolJoin?.name ?? null;

    if (inviteType !== 'staff_join') {
      return { ok: false, reason: 'wrong_invite_type', schoolName };
    }

    if (new Date(inv.expires_at as string) < new Date()) {
      return {
        ok: false,
        reason: 'expired',
        schoolName,
        role: inv.role as string,
        email: (inv.email as string | null) ?? null,
      };
    }

    return {
      ok: true,
      inviteType,
      schoolName,
      role: inv.role as string,
      email: (inv.email as string | null) ?? null,
    };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

async function getStaffInviteEmailByToken(raw: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('invitations')
      .select('email')
      .eq('token', raw)
      .eq('invite_type', 'staff_join')
      .maybeSingle();
    return (data?.email as string | null) ?? null;
  } catch {
    return null;
  }
}

export async function getValidStaffInvitationByToken(
  rawToken: string,
): Promise<StaffInvitationRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('invitations')
    .select('id, token, school_id, role, email, expires_at, used_at')
    .eq('token', rawToken.trim())
    .eq('invite_type', 'staff_join')
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data as StaffInvitationRow;
}

export async function createStaffInvitation(input: {
  schoolId: string;
  email: string;
  role: InvitableStaffRole;
  createdByUserId: string;
}): Promise<{ token: string; inviteUrl: string; expiresAt: string; invitationId: string }> {
  const admin = createAdminClient();
  const { raw } = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await admin
    .from('invitations')
    .insert({
      invite_type: 'staff_join',
      token: raw,
      expires_at: expiresAt.toISOString(),
      school_id: input.schoolId,
      role: input.role,
      email: input.email.toLowerCase(),
      created_by: input.createdByUserId,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Invitation impossible.');

  const base = appBaseUrl().replace(/\/$/, '');
  return {
    token: raw,
    inviteUrl: `${base}/join?invite=${raw}`,
    expiresAt: expiresAt.toISOString(),
    invitationId: data.id as string,
  };
}

export async function acceptStaffInvitation(input: {
  token: string;
  firstName?: string;
  lastName?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('accept_staff_invitation', {
    p_token: input.token.trim(),
    p_first_name: input.firstName ?? null,
    p_last_name: input.lastName ?? null,
  });
  if (error) throw new Error(error.message);
}

export function buildStaffJoinUrl(rawToken: string): string {
  const base = appBaseUrl().replace(/\/$/, '');
  return `${base}/join?invite=${rawToken}`;
}

export function extractStaffInviteToken(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  try {
    if (trimmed.includes('://') || trimmed.startsWith('/')) {
      const url = trimmed.startsWith('/')
        ? new URL(trimmed, appBaseUrl())
        : new URL(trimmed);
      return url.searchParams.get('invite')?.trim() ?? trimmed;
    }
  } catch {
    /* token brut */
  }
  return trimmed;
}

/** Message utilisateur quand la RPC accept_staff_invitation est absente. */
export function isAcceptStaffInvitationMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('accept_staff_invitation') ||
    (lower.includes('function') && lower.includes('does not exist')) ||
    lower.includes('could not find the function')
  );
}
