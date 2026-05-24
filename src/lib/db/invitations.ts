import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { InvitableStaffRole } from '@/lib/auth/types';
import { generateOpaqueToken } from '@/lib/auth/tokens';
import { appBaseUrl } from '@/lib/env';

export type StaffInvitePreview = {
  ok: boolean;
  inviteType?: string;
  schoolName?: string | null;
  role?: string | null;
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

export async function peekStaffInvitation(
  token: string,
): Promise<StaffInvitePreview> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('peek_invitation', {
    p_token: token.trim(),
  });
  if (error) return { ok: false, reason: 'error' };
  const row = data as {
    ok: boolean;
    invite_type?: string;
    school_name?: string | null;
    role?: string | null;
    reason?: string;
  };
  if (!row?.ok) {
    return { ok: false, reason: row?.reason ?? 'not_found' };
  }
  if (row.invite_type !== 'staff_join') {
    return { ok: false, reason: 'wrong_invite_type' };
  }
  return {
    ok: true,
    inviteType: row.invite_type,
    schoolName: row.school_name ?? null,
    role: row.role ?? null,
  };
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
}): Promise<{ token: string; inviteUrl: string; expiresAt: string }> {
  const admin = createAdminClient();
  const { raw } = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error } = await admin.from('invitations').insert({
    invite_type: 'staff_join',
    token: raw,
    expires_at: expiresAt.toISOString(),
    school_id: input.schoolId,
    role: input.role,
    email: input.email.toLowerCase(),
    created_by: input.createdByUserId,
  });

  if (error) throw new Error(error.message);

  const base = appBaseUrl().replace(/\/$/, '');
  return {
    token: raw,
    inviteUrl: `${base}/join?invite=${raw}`,
    expiresAt: expiresAt.toISOString(),
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
    /* raw token */
  }
  return trimmed;
}
