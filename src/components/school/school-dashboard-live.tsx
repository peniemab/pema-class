'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { SchoolDashboard } from '@/components/school/school-dashboard';
import {
  SettingsGroup,
  SettingsScreen,
} from '@/components/school/settings-ui';
import { getOfflineDb, metaKey } from '@/lib/offline/db';
import type { DashboardPageData } from '@/lib/db/dashboard-page';
import { cn } from '@/lib/utils';

const SCOPE = 'school-dashboard';

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-wa-divider/80', className)}
      aria-hidden
    />
  );
}

/** Squelette fidèle à la mise en page du tableau de bord. */
function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement du tableau de bord">
      <SettingsScreen className="max-w-3xl">
      <div className="mx-4 mt-4 rounded-2xl border border-wa-divider bg-wa-panel p-4">
        <div className="flex items-center gap-3">
          <Bone className="size-12 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className="h-4 w-40" />
            <Bone className="h-3 w-24" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Bone className="h-6 w-12" />
              <Bone className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-y border-wa-divider bg-wa-panel p-5">
        <Bone className="h-3 w-32" />
        <Bone className="mt-3 h-8 w-48" />
        <Bone className="mt-2 h-3 w-24" />
        <Bone className="mt-4 h-2 w-full rounded-full" />
        <div className="mt-2 flex justify-between">
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-24" />
        </div>
      </div>

      <SettingsGroup title="Raccourcis">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
          >
            <Bone className="size-6 rounded" />
            <Bone className="h-4 w-28" />
            <Bone className="ml-auto h-4 w-16" />
          </div>
        ))}
      </SettingsGroup>

      <SettingsGroup title="Effectifs">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Bone className="size-6 rounded" />
            <Bone className="h-4 w-32" />
            <Bone className="ml-auto h-4 w-10" />
          </div>
        ))}
      </SettingsGroup>
      </SettingsScreen>
    </div>
  );
}

type Props = {
  schoolId: string;
};

/**
 * Tableau de bord « squelette d'abord » : la structure s'affiche tout de
 * suite, les chiffres arrivent après la réponse Supabase. Sur les visites
 * suivantes, les derniers chiffres connus (cache Dexie) s'affichent
 * instantanément puis se rafraîchissent.
 */
export function SchoolDashboardLive({ schoolId }: Props) {
  const cached = useLiveQuery(
    () => getOfflineDb().meta.get(metaKey(schoolId, SCOPE)),
    [schoolId],
  );
  const [fresh, setFresh] = useState<DashboardPageData | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/sync/dashboard', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then((res) => (res.ok ? (res.json() as Promise<DashboardPageData>) : null))
      .then((data) => {
        if (!alive || !data) return;
        setFresh(data);
        void getOfflineDb().meta.put({
          key: metaKey(schoolId, SCOPE),
          school_id: schoolId,
          scope: SCOPE,
          value: data,
          updated_at: new Date().toISOString(),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [schoolId]);

  const data = fresh ?? (cached?.value as DashboardPageData | undefined) ?? null;

  if (!data) return <DashboardSkeleton />;
  return <SchoolDashboard data={data} />;
}
