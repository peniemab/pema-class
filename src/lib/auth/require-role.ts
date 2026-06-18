import { cache } from 'react';
import { redirect } from 'next/navigation';
import {
  getAuthPrincipal,
  getStaffByUserId,
  isPlatformAdmin,
} from '@/lib/db/staff';
import { createClient } from '@/lib/supabase/server';
import {
  getRoleHomePath,
  normalizeStaffRole,
  ENROLLMENT_ROLES,
  FINANCE_ROLES,
  REPORT_ROLES,
  SCHOOL_DIRECTION_ROLES,
  type AuthPrincipal,
  type StaffRole,
} from '@/lib/auth/types';

const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireSession(): Promise<{ userId: string; email: string }> {
  const user = await getSessionUser();
  if (!user) {
    redirect('/');
  }
  return { userId: user.id, email: user.email ?? '' };
}

export async function requireAuthPrincipal(): Promise<AuthPrincipal> {
  const { userId } = await requireSession();
  const principal = await getAuthPrincipal(userId);
  if (!principal) {
    redirect('/');
  }
  return principal;
}

export async function requireSuperadmin(): Promise<{ userId: string }> {
  const { userId } = await requireSession();
  if (!(await isPlatformAdmin(userId))) {
    redirect('/');
  }
  return { userId };
}

export async function requireSchoolDirection(): Promise<{
  userId: string;
  schoolId: string;
  staffId: string;
  role: StaffRole;
}> {
  const { userId } = await requireSession();
  const staff = await getStaffByUserId(userId);
  if (!staff?.school_id) {
    redirect('/post-login');
  }
  const role = normalizeStaffRole(staff.role);
  if (!SCHOOL_DIRECTION_ROLES.includes(role)) {
    redirect('/post-login');
  }
  return {
    userId,
    schoolId: staff.school_id,
    staffId: staff.id,
    role,
  };
}

export async function requireSchoolStaff(): Promise<{
  userId: string;
  schoolId: string;
  staffId: string;
  role: StaffRole;
}> {
  const { userId } = await requireSession();
  const staff = await getStaffByUserId(userId);
  if (!staff?.school_id || staff.status !== 'active' || !staff.is_active) {
    redirect('/post-login');
  }
  const role = normalizeStaffRole(staff.role);
  if (SCHOOL_DIRECTION_ROLES.includes(role)) {
    redirect('/school');
  }
  return {
    userId,
    schoolId: staff.school_id,
    staffId: staff.id,
    role,
  };
}

export async function requireSchoolEnrollment(): Promise<{
  userId: string;
  schoolId: string;
  staffId: string;
  role: StaffRole;
}> {
  const { userId } = await requireSession();
  const staff = await getStaffByUserId(userId);
  if (!staff?.school_id || staff.status !== 'active' || !staff.is_active) {
    redirect('/post-login');
  }
  const role = normalizeStaffRole(staff.role);
  if (!ENROLLMENT_ROLES.includes(role)) {
    redirect('/post-login');
  }
  return {
    userId,
    schoolId: staff.school_id,
    staffId: staff.id,
    role,
  };
}

export async function requireSchoolReports(): Promise<{
  userId: string;
  schoolId: string;
  staffId: string;
  role: StaffRole;
}> {
  const { userId } = await requireSession();
  const staff = await getStaffByUserId(userId);
  if (!staff?.school_id || staff.status !== 'active' || !staff.is_active) {
    redirect('/post-login');
  }
  const role = normalizeStaffRole(staff.role);
  if (!REPORT_ROLES.includes(role)) {
    redirect('/post-login');
  }
  if (SCHOOL_DIRECTION_ROLES.includes(role)) {
    redirect('/school/rapports');
  }
  return {
    userId,
    schoolId: staff.school_id,
    staffId: staff.id,
    role,
  };
}

export async function requireSchoolFinance(): Promise<{
  userId: string;
  schoolId: string;
  staffId: string;
  role: StaffRole;
}> {
  const { userId } = await requireSession();
  const staff = await getStaffByUserId(userId);
  if (!staff?.school_id || staff.status !== 'active' || !staff.is_active) {
    redirect('/post-login');
  }
  const role = normalizeStaffRole(staff.role);
  if (!FINANCE_ROLES.includes(role)) {
    redirect('/post-login');
  }
  return {
    userId,
    schoolId: staff.school_id,
    staffId: staff.id,
    role,
  };
}

export async function resolvePostLoginPath(userId: string): Promise<string> {
  if (await isPlatformAdmin(userId)) {
    return getRoleHomePath('superadmin');
  }
  const staff = await getStaffByUserId(userId);
  if (!staff) {
    return '/?error=no_profile';
  }
  return getRoleHomePath(normalizeStaffRole(staff.role));
}
