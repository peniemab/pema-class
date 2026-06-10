import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/require-role';
import { getStaffByUserId } from '@/lib/db/staff';
import {
  ATTENDANCE_ROLES,
  normalizeStaffRole,
  SCHOOL_DIRECTION_ROLES,
} from '@/lib/auth/types';

export default async function AppPresencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await requireSession();
  const staff = await getStaffByUserId(userId);
  if (!staff?.school_id || staff.status !== 'active' || !staff.is_active) {
    redirect('/post-login');
  }
  const role = normalizeStaffRole(staff.role);
  if (SCHOOL_DIRECTION_ROLES.includes(role)) {
    redirect('/school/presences');
  }
  if (!ATTENDANCE_ROLES.includes(role)) {
    redirect('/app');
  }
  return children;
}
