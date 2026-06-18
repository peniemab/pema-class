import { requireSchoolStaff } from '@/lib/auth/require-role';
import { StaffShellMain } from '@/components/school/mobile/staff-shell-main';

export const dynamic = 'force-dynamic';

export default async function StaffAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireSchoolStaff();
  return <StaffShellMain role={role}>{children}</StaffShellMain>;
}
