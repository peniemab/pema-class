import Link from 'next/link';
import { Suspense } from 'react';
import type { AttendancePageData } from '@/lib/db/attendance-page';
import { PresencesFilters } from '@/components/school/presences/presences-filters';
import { PresencesPanel } from '@/components/school/presences/presences-panel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Props = {
  data: AttendancePageData | null;
  basePath: '/school/presences' | '/app/presences';
};

export function PresencesPageView({ data, basePath }: Props) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-0">
      {!data ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link
              href="/school/parametres#referentiels"
              className="font-medium text-wa-accent underline"
            >
              année scolaire active
            </Link>{' '}
            et des classes.
          </AlertDescription>
        </Alert>
      ) : data.classes.length === 0 ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            {data.teacherLimited
              ? 'Aucune classe ne vous est assignée. Contactez la direction.'
              : 'Aucune classe pour cette année. Ajoutez des classes dans les référentiels.'}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {data.stats.total > 0 ? (
            <div className="grid grid-cols-4 gap-px border-b border-wa-divider bg-wa-divider">
              <StatCard label="Inscrits" value={data.stats.total} />
              <StatCard
                label="Présents"
                value={data.stats.present}
                className="text-emerald-700"
              />
              <StatCard label="Absents" value={data.stats.absent} className="text-destructive" />
              <StatCard label="Retards" value={data.stats.late} className="text-amber-600" />
            </div>
          ) : null}

          <Suspense fallback={null}>
            <div className="border-b border-wa-divider bg-wa-panel px-4 py-3">
              <PresencesFilters
                classes={data.classes}
                selectedClassId={data.selectedClassId}
                selectedDate={data.selectedDate}
                basePath={basePath}
              />
            </div>
          </Suspense>

          {data.rows.length === 0 ? (
            <Alert className="mx-4 mt-4">
              <AlertDescription>
                Aucun élève inscrit dans cette classe pour {data.activeYear.name}.
              </AlertDescription>
            </Alert>
          ) : (
            <PresencesPanel
              key={`${data.selectedClassId}-${data.selectedDate}`}
              data={data}
              basePath={basePath}
            />
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="bg-wa-panel px-2 py-3 text-center">
      <p className={cn('text-lg font-semibold tabular-nums', className)}>{value}</p>
      <p className="text-[0.625rem] text-wa-text-secondary">{label}</p>
    </div>
  );
}
