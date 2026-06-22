import { tryRequireSchoolDirection } from '@/lib/auth/try-require-role';
import { AppShell } from '@/components/app-shell';
import { DirectionOfflineShell } from '@/components/offline/direction-offline-shell';
import { PersistLocalSession } from '@/components/offline/persist-local-session';
import { OfflineModeBanner } from '@/components/offline/offline-mode-banner';

export const dynamic = 'force-dynamic';

export default async function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await tryRequireSchoolDirection();

  if (!ctx) {
    return <DirectionOfflineShell>{children}</DirectionOfflineShell>;
  }

  return (
    <>
      <PersistLocalSession auth={ctx} />
      <OfflineModeBanner />
      <AppShell variant="school">{children}</AppShell>
    </>
  );
}
