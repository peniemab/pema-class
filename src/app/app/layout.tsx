import { requireSchoolStaff } from '@/lib/auth/require-role';
import { AppShell } from '@/components/app-shell';

export const dynamic = 'force-dynamic';

export default async function StaffAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSchoolStaff();
  return <AppShell variant="app">{children}</AppShell>;
}
