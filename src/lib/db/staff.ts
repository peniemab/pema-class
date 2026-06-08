import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  normalizeStaffRole,
  type AuthPrincipal,
  type StaffRole,
} from '@/lib/auth/types';
import { isAdminApiConfigured } from '@/lib/env';

export type StaffRow = {
  id: string;
  school_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  status: string;
};

/**
 * Vérifie si l'utilisateur est superadmin.
 * Utilise la session courante + RLS (pas besoin de service role pour post-login).
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id === userId) {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) return true;
    }
  } catch {
    /* session ou réseau indisponible */
  }

  if (!isAdminApiConfigured()) return false;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

const staffSelect =
  'id, school_id, user_id, first_name, last_name, role, phone, email, is_active, status';

export async function getStaffByUserId(userId: string): Promise<StaffRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('staff')
      .select(staffSelect)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    if (!error && data) return data as StaffRow;
  } catch {
    /* ignore */
  }

  if (!isAdminApiConfigured()) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('staff')
      .select(staffSelect)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    if (error || !data) return null;
    return data as StaffRow;
  } catch {
    return null;
  }
}

export async function getAuthPrincipal(userId: string): Promise<AuthPrincipal | null> {
  if (await isPlatformAdmin(userId)) {
    return { kind: 'superadmin', userId };
  }
  const staff = await getStaffByUserId(userId);
  if (!staff?.user_id || !staff.school_id) return null;
  return {
    kind: 'staff',
    userId: staff.user_id,
    staffId: staff.id,
    schoolId: staff.school_id,
    role: normalizeStaffRole(staff.role),
    email: staff.email,
  };
}

export async function createStaff(input: {
  schoolId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: StaffRole | 'school_admin';
}): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('staff')
    .insert({
      school_id: input.schoolId,
      user_id: input.userId,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      role: input.role,
      email: input.email,
      phone: input.phone,
      is_active: true,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

/** @deprecated Utiliser createStaff */
export async function insertSchoolAdminStaff(input: {
  schoolId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
}): Promise<string> {
  const parts = input.fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? 'Admin';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'École';
  return createStaff({
    schoolId: input.schoolId,
    userId: input.userId,
    firstName,
    lastName,
    email: input.email,
    phone: input.phone,
    role: 'school_admin',
  });
}
