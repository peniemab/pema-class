import { tryRequireSchoolStaff } from '@/lib/auth/try-require-role';
import { StaffShellMain } from '@/components/school/mobile/staff-shell-main';
import { StaffOfflineShell } from '@/components/offline/staff-offline-shell';
import { PersistLocalSession } from '@/components/offline/persist-local-session';
import { OfflineModeBanner } from '@/components/offline/offline-mode-banner';

export const dynamic = 'force-dynamic';

export default async function StaffAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await tryRequireSchoolStaff();

  if (!ctx) {
    return <StaffOfflineShell>{children}</StaffOfflineShell>;
  }

  return (
    <>
      <PersistLocalSession auth={ctx} />
      <OfflineModeBanner />
      <StaffShellMain role={ctx.role}>{children}</StaffShellMain>
    </>
  );
}
