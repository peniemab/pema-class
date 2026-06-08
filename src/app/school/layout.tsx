import { requireSchoolDirection } from '@/lib/auth/require-role';
import { AppShell } from '@/components/app-shell';

export default async function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSchoolDirection();
  return <AppShell variant="school">{children}</AppShell>;
}
