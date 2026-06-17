import { requireSuperadmin } from '@/lib/auth/require-role';
import { AppShell } from '@/components/app-shell';

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSuperadmin();

  return <AppShell variant="platform">{children}</AppShell>;
}
