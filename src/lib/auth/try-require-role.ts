import { getStaffByUserId } from '@/lib/db/staff';
import { createClient } from '@/lib/supabase/server';
import {
  normalizeStaffRole,
  SCHOOL_DIRECTION_ROLES,
  type StaffRole,
} from '@/lib/auth/types';

export type StaffAuthContext = {
  userId: string;
  schoolId: string;
  staffId: string;
  role: StaffRole;
  email: string;
};

export async function getOptionalSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Comme requireSchoolStaff mais sans redirect — boot offline si réseau/DB indisponible. */
export async function tryRequireSchoolStaff(): Promise<StaffAuthContext | null> {
  const user = await getOptionalSessionUser();
  if (!user) return null;

  let staff;
  try {
    staff = await getStaffByUserId(user.id);
  } catch {
    return null;
  }

  if (!staff?.school_id || staff.status !== 'active' || !staff.is_active) {
    return null;
  }

  const role = normalizeStaffRole(staff.role);
  if (SCHOOL_DIRECTION_ROLES.includes(role)) {
    return null;
  }

  return {
    userId: user.id,
    schoolId: staff.school_id,
    staffId: staff.id,
    role,
    email: user.email ?? '',
  };
}

/** Comme requireSchoolDirection mais sans redirect. */
export async function tryRequireSchoolDirection(): Promise<StaffAuthContext | null> {
  const user = await getOptionalSessionUser();
  if (!user) return null;

  let staff;
  try {
    staff = await getStaffByUserId(user.id);
  } catch {
    return null;
  }

  if (!staff?.school_id) return null;

  const role = normalizeStaffRole(staff.role);
  if (!SCHOOL_DIRECTION_ROLES.includes(role)) {
    return null;
  }

  return {
    userId: user.id,
    schoolId: staff.school_id,
    staffId: staff.id,
    role,
    email: user.email ?? '',
  };
}
