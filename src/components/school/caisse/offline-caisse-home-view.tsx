'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { OfflineCaisseSearchPanel } from '@/components/school/caisse/offline-caisse-search-panel';
import { SyncStatusBadge } from '@/components/offline/sync-status-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { saveCaisseSnapshot } from '@/lib/offline/caisse-repo';
import { useCaisseSync } from '@/lib/offline/use-caisse-sync';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';

type Props = {
  schoolId: string;
  caisseBasePath: '/school/caisse' | '/app/caisse';
  initialSnapshot: CaisseSnapshot | null;
  /**
   * Si fourni, l'encaissement s'ouvre en panneau (workspace keep-alive)
   * au lieu de naviguer vers `${caisseBasePath}/${studentId}`.
   */
  onOpenStudent?: (studentId: string) => void;
};

export function OfflineCaisseHomeView({
  schoolId,
  caisseBasePath,
  initialSnapshot,
  onOpenStudent,
}: Props) {
  const router = useRouter();
  const { state, phase, online, pendingCount, refresh } =
    useCaisseSync(schoolId);

  useEffect(() => {
    if (initialSnapshot) {
      void saveCaisseSnapshot(initialSnapshot);
    }
  }, [initialSnapshot]);

  const activeYear = state?.activeYear ?? initialSnapshot?.activeYear ?? null;

  const onSelectStudent = useCallback(
    (studentId: string) => {
      if (onOpenStudent) {
        onOpenStudent(studentId);
        return;
      }
      router.push(`${caisseBasePath}/${studentId}`);
    },
    [router, caisseBasePath, onOpenStudent],
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-0">
      <div className="no-print flex items-center justify-end px-4 py-2">
        <SyncStatusBadge
          phase={phase}
          online={online}
          lastSyncAt={state?.lastSyncAt}
          pendingCount={pendingCount}
          onRefresh={refresh}
        />
      </div>

      <Alert className="mx-4 mt-4 border-0 bg-wa-panel">
        <AlertDescription className="flex items-start gap-2">
          <Wallet className="mt-0.5 size-4 shrink-0 text-wa-accent" aria-hidden />
          {activeYear
            ? `Encaissement pour ${activeYear.name} — fonctionne hors ligne.`
            : 'Activez une année scolaire pour encaisser des frais.'}
        </AlertDescription>
      </Alert>

      <div className="mt-4 border-y border-wa-divider bg-wa-panel px-4 py-4">
        <OfflineCaisseSearchPanel
          schoolId={schoolId}
          caisseBasePath={caisseBasePath}
          onSelectStudent={onSelectStudent}
        />
      </div>
    </div>
  );
}
