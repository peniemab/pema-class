import { redirect } from 'next/navigation';
import { ENROLLMENT_ROLES } from '@/lib/auth/types';
import { requireSchoolStaff } from '@/lib/auth/require-role';

export default async function AppElevesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireSchoolStaff();
  if (!ENROLLMENT_ROLES.includes(role)) {
    redirect('/app');
  }
  return children;
}
