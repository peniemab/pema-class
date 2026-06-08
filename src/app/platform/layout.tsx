import { PlatformShell } from '@/components/platform/platform-shell';
import { requireSuperadmin, requireSession } from '@/lib/auth/require-role';

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSuperadmin();
  const { email } = await requireSession();

  return (
    <PlatformShell user={{ email }}>
      {children}
    </PlatformShell>
  );
}
