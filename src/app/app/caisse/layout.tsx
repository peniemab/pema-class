import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/require-role';
import { getStaffByUserId } from '@/lib/db/staff';
import {
  FINANCE_ROLES,
  normalizeStaffRole,
  SCHOOL_DIRECTION_ROLES,
} from '@/lib/auth/types';

export default async function AppCaisseLayout({
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
    redirect('/school/caisse');
  }
  if (!FINANCE_ROLES.includes(role)) {
    redirect('/app');
  }
  return children;
}
