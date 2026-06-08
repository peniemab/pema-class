import type { SchoolStatus, StaffRole, StaffStatus } from '@/lib/auth/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOnboardingLinkStatus } from '@/lib/platform/format';
import { buildOnboardingUrl } from '@/lib/platform/onboarding-url';
import { normalizeStaffRole } from '@/lib/auth/types';

export type PlatformSchoolRow = {
  id: string;
  name: string;
  slug: string | null;
  status: SchoolStatus;
  created_at: string;
  director: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    user_id: string | null;
    status: StaffStatus;
  } | null;
  active_staff_count: number;
};

export type PlatformSchoolStats = {
  total: number;
  active: number;
  suspended: number;
  archived: number;
};

export type PlatformOnboardingRow = {
  id: string;
  school_id: string | null;
  email: string | null;
  internal_note: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  school_name: string | null;
  draft_school_name: string | null;
  onboarding_url: string | null;
  link_status: 'pending' | 'used' | 'expired';
};

type StaffAggRow = {
  school_id: string | null;
  role: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string;
  user_id: string | null;
};

const DIRECTOR_ROLES = ['school_admin', 'director', 'admin'];

function pickDirector(rows: StaffAggRow[], schoolId: string) {
  const admins = rows.filter(
    (r) =>
      r.school_id === schoolId &&
      DIRECTOR_ROLES.includes(r.role),
  );
  if (admins.length === 0) {
    return null;
  }
  const schoolAdmin = admins.find((a) => a.role === 'school_admin' || a.role === 'director');
  const active = (schoolAdmin ?? admins[0]);
  const activePreferred = admins.find((a) => a.status === 'active') ?? active;
  return activePreferred;
}

function countActiveStaff(rows: StaffAggRow[], schoolId: string): number {
  return rows.filter(
    (r) =>
      r.school_id === schoolId &&
      r.status === 'active',
  ).length;
}

export async function getPlatformSchoolStats(): Promise<PlatformSchoolStats> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('schools').select('status');

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === 'active').length,
    suspended: rows.filter((r) => r.status === 'suspended').length,
    archived: rows.filter((r) => r.status === 'archived').length,
  };
}

export async function listPlatformSchools(): Promise<PlatformSchoolRow[]> {
  const supabase = createAdminClient();

  const { data: schools, error: sError } = await supabase
    .from('schools')
    .select('id, name, slug, status, created_at')
    .order('created_at', { ascending: false });

  if (sError) {
    throw new Error(sError.message);
  }

  if (!schools?.length) {
    return [];
  }

  const ids = schools.map((s) => s.id);
  const { data: staffRows, error: stError } = await supabase
    .from('staff')
    .select(
      'school_id, role, email, first_name, last_name, status, user_id',
    )
    .in('school_id', ids);

  if (stError) {
    throw new Error(stError.message);
  }

  const staff = (staffRows ?? []) as StaffAggRow[];

  return schools.map((s) => {
    const director = pickDirector(staff, s.id);
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: (s.status ?? 'active') as SchoolStatus,
      created_at: s.created_at,
      director: director
        ? {
            email: director.email ?? '',
            first_name: director.first_name,
            last_name: director.last_name,
            user_id: director.user_id,
            status: director.status as StaffStatus,
          }
        : null,
      active_staff_count: countActiveStaff(staff, s.id),
    };
  });
}

export async function getPlatformSchoolById(
  id: string,
): Promise<PlatformSchoolRow | null> {
  const rows = await listPlatformSchools();
  return rows.find((s) => s.id === id) ?? null;
}

export type PlatformStaffMember = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: StaffRole;
  status: StaffStatus;
  user_id: string | null;
};

export async function listSchoolStaff(
  schoolId: string,
): Promise<PlatformStaffMember[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('staff')
    .select('id, email, first_name, last_name, role, status, user_id')
    .eq('school_id', schoolId)
    .order('role', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    ...row,
    role: normalizeStaffRole(row.role),
    status: row.status as StaffStatus,
  })) as PlatformStaffMember[];
}

export async function updateSchoolStatus(
  schoolId: string,
  status: SchoolStatus,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('schools')
    .update({ status })
    .eq('id', schoolId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listOnboardingTokens(options?: {
  filter?: 'pending' | 'used' | 'expired' | 'all';
  limit?: number;
}): Promise<PlatformOnboardingRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('school_onboarding_tokens')
    .select(
      `
      id,
      school_id,
      email,
      internal_note,
      raw_token,
      expires_at,
      used_at,
      created_at,
      draft_school_name,
      schools ( name )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 200);

  if (error) {
    throw new Error(error.message);
  }

  const mapped: PlatformOnboardingRow[] = (data ?? []).map((row) => {
    const schoolJoin = row.schools as
      | { name: string }
      | { name: string }[]
      | null;
    const schoolName = Array.isArray(schoolJoin)
      ? schoolJoin[0]?.name
      : schoolJoin?.name;

    const linkStatus = getOnboardingLinkStatus({
      used_at: row.used_at,
      expires_at: row.expires_at,
    });
    const rawToken = row.raw_token as string | null;

    return {
      id: row.id,
      school_id: row.school_id,
      email: row.email,
      internal_note: row.internal_note ?? null,
      expires_at: row.expires_at,
      used_at: row.used_at,
      created_at: row.created_at,
      school_name: schoolName ?? row.draft_school_name ?? null,
      draft_school_name: row.draft_school_name,
      link_status: linkStatus,
      onboarding_url:
        linkStatus === 'pending' && rawToken
          ? buildOnboardingUrl(rawToken)
          : null,
    };
  });

  const filter = options?.filter ?? 'all';
  if (filter === 'all') {
    return mapped;
  }

  return mapped.filter((t) => getOnboardingLinkStatus(t) === filter);
}

export async function getRecentOnboardingSummary() {
  const tokens = await listOnboardingTokens({ limit: 50 });
  return {
    pending: tokens.filter((t) => getOnboardingLinkStatus(t) === 'pending')
      .length,
    used: tokens.filter((t) => getOnboardingLinkStatus(t) === 'used').length,
    expired: tokens.filter((t) => getOnboardingLinkStatus(t) === 'expired')
      .length,
    recent: tokens.slice(0, 5),
  };
}

export async function directorNeedsOnboarding(schoolId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('staff')
    .select('user_id, status, role')
    .eq('school_id', schoolId)
    .in('role', ['school_admin', 'director'])
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return true;
  }
  return !data.user_id || data.status !== 'active';
}
