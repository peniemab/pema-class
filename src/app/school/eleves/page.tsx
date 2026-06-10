import Link from 'next/link';
import { Suspense } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { loadStudentsListPage } from '@/lib/school/students-actions';
import { StudentsFilters } from '@/components/school/students/students-filters';
import { StudentsPagination } from '@/components/school/students/students-pagination';
import { StudentsTable } from '@/components/school/students/students-table';
import { ButtonLink } from '@/components/ui/button-link';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SchoolElevesPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadStudentsListPage(params);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-0">
      {data.activeYear ? (
        <div className="no-print fixed bottom-[calc(3.25rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-30 md:bottom-6">
          <ButtonLink
            href="/school/eleves/nouveau"
            size="icon"
            className="size-14 rounded-full bg-primary shadow-lg hover:bg-primary-dark"
            aria-label="Inscrire un élève"
          >
            <UserPlus className="size-6" aria-hidden />
          </ButtonLink>
        </div>
      ) : null}

      {!data.activeYear ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link href="/school/parametres#referentiels" className="font-medium text-wa-accent underline">
              année scolaire active
            </Link>{' '}
            et des classes.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {data.stats ? (
            <div className="grid grid-cols-3 gap-px border-b border-wa-divider bg-wa-divider">
              <div className="bg-wa-panel px-3 py-3">
                <p className="text-xl font-semibold tabular-nums">{data.stats.total}</p>
                <p className="text-[0.6875rem] text-wa-text-secondary">Actifs</p>
              </div>
              <div className="bg-wa-panel px-3 py-3">
                <p className="text-xl font-semibold tabular-nums">{data.stats.enrolled}</p>
                <p className="text-[0.6875rem] text-wa-text-secondary">Inscrits</p>
              </div>
              <div className="bg-wa-panel px-3 py-3">
                <p className="text-xl font-semibold tabular-nums">{data.stats.unassigned}</p>
                <p className="text-[0.6875rem] text-wa-text-secondary">Sans classe</p>
              </div>
            </div>
          ) : null}

          <Suspense fallback={null}>
            <div className="border-b border-wa-divider bg-wa-panel px-4 py-3">
              <StudentsFilters
                classes={data.classes}
                filters={{
                  search: data.filters.search,
                  classId: data.filters.classId,
                  status: data.filters.status ?? 'all',
                  unassignedOnly: data.filters.unassignedOnly,
                }}
              />
            </div>
          </Suspense>

          {data.directory && data.directory.total === 0 && !data.filters.search ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-wa-text-secondary">
                Aucun élève inscrit pour {data.activeYear.name}.
              </p>
              <ButtonLink href="/school/eleves/nouveau" className="mt-4 gap-1.5 bg-primary hover:bg-primary-dark" size="sm">
                <Plus className="size-4" aria-hidden />
                Première inscription
              </ButtonLink>
            </div>
          ) : data.directory ? (
            <>
              <StudentsTable rows={data.directory.rows} />
              <div className="border-t border-wa-divider bg-wa-panel px-4 py-4">
                <StudentsPagination
                  page={data.directory.page}
                  pageSize={data.directory.pageSize}
                  total={data.directory.total}
                  searchParams={params}
                />
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
