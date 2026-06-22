'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2 } from 'lucide-react';
import { ImpayesStatsCards } from '@/components/school/impayes/impayes-stats';
import { RecouvrementLiveView } from '@/components/school/impayes/recouvrement-live-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getOfflineDb, metaKey } from '@/lib/offline/db';
import type { ImpayesPageData } from '@/lib/db/impayes-page';
import { useAppData } from '@/lib/offline/app-data-context';
import { buildImpayesFromAppData } from '@/lib/offline/impayes-local';
import { IMPAYES_META_SCOPE } from '@/lib/offline/prefetch-impayes';
import { prefetchRecouvrementSnapshot } from '@/lib/offline/prefetch-recouvrement';
import { getSchoolFeeCurrencies } from '@/lib/school/fee-currencies';
import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-wa-divider/80', className)}
      aria-hidden
    />
  );
}

function ImpayesSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement des impayés">
      <div className="border-b border-wa-divider bg-wa-panel p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

type Props = {
  schoolId: string;
};

export function ImpayesLiveView({ schoolId }: Props) {
  const appData = useAppData();
  const [recouvrementFeeId, setRecouvrementFeeId] = useState<string | null>(null);

  const localData = useMemo(
    () => buildImpayesFromAppData(appData),
    [appData],
  );

  const cached = useLiveQuery(
    () => getOfflineDb().meta.get(metaKey(schoolId, IMPAYES_META_SCOPE)),
    [schoolId],
  );
  const [fresh, setFresh] = useState<ImpayesPageData | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/sync/impayes', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => (res.ok ? (res.json() as Promise<ImpayesPageData>) : null))
      .then((data) => {
        if (!alive || !data) return;
        setFresh(data);
        void getOfflineDb().meta.put({
          key: metaKey(schoolId, IMPAYES_META_SCOPE),
          school_id: schoolId,
          scope: IMPAYES_META_SCOPE,
          value: data,
          updated_at: new Date().toISOString(),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [schoolId]);

  const data =
    fresh ??
    (cached?.value as ImpayesPageData | undefined) ??
    localData ??
    null;

  useEffect(() => {
    if (!data?.stats?.feeBreakdown?.length) return;
    for (const fee of data.stats.feeBreakdown) {
      prefetchRecouvrementSnapshot(schoolId, fee.fee_id);
    }
  }, [schoolId, data?.stats?.feeBreakdown]);

  if (!data) return <ImpayesSkeleton />;

  if (recouvrementFeeId) {
    return (
      <RecouvrementLiveView
        schoolId={schoolId}
        feeId={recouvrementFeeId}
        onBack={() => setRecouvrementFeeId(null)}
        onFeeChange={setRecouvrementFeeId}
      />
    );
  }

  const feeCurrencies = getSchoolFeeCurrencies(data.fees);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-0 pb-8">
      {!data.activeYear ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link
              href="/school/parametres#referentiels"
              className="font-medium text-wa-accent underline"
            >
              année scolaire active
            </Link>{' '}
            et des frais.
          </AlertDescription>
        </Alert>
      ) : data.fees.length === 0 ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            Aucun frais défini pour {data.activeYear.name}. Ajoutez des frais dans les{' '}
            <Link
              href="/school/parametres#referentiels"
              className="font-medium text-wa-accent underline"
            >
              référentiels
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="border-b border-wa-divider bg-wa-panel p-4">
            {data.stats ? (
              <ImpayesStatsCards
                stats={data.stats}
                feeCurrencies={feeCurrencies}
                onFeeSelect={setRecouvrementFeeId}
              />
            ) : null}
          </div>

          {data.stats && data.stats.studentsWithDebt === 0 ? (
            <div className="mx-4 mt-4 border border-emerald-200/60 bg-emerald-50/40 px-6 py-10 text-center">
              <CheckCircle2 className="mx-auto size-8 text-emerald-600" aria-hidden />
              <p className="mt-3 font-medium text-emerald-800">
                Tous les élèves inscrits sont à jour
              </p>
              <p className="mt-1 text-sm text-wa-text-secondary">
                Aucun frais en attente pour {data.activeYear.name}.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
