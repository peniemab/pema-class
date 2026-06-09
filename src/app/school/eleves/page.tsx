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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Annuaire élèves</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.activeYear
              ? `Année ${data.activeYear.name} — recherche, filtres et fiches élèves.`
              : 'Activez une année scolaire pour gérer les élèves.'}
          </p>
        </div>
        {data.activeYear ? (
          <ButtonLink href="/school/eleves/nouveau" size="sm" className="gap-1.5">
            <UserPlus className="size-4" aria-hidden />
            Inscrire un élève
          </ButtonLink>
        ) : null}
      </div>

      {!data.activeYear ? (
        <Alert>
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link href="/school/parametres/referentiels" className="font-medium text-primary underline">
              année scolaire active
            </Link>{' '}
            et des classes.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {data.stats ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">{data.stats.total}</p>
                <p className="text-xs text-muted-foreground">Élèves actifs</p>
              </div>
              <div className="rounded-lg border bg-muted/20 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">{data.stats.enrolled}</p>
                <p className="text-xs text-muted-foreground">Inscrits cette année</p>
              </div>
              <div className="rounded-lg border bg-muted/20 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">
                  {data.stats.unassigned}
                </p>
                <p className="text-xs text-muted-foreground">Sans classe</p>
              </div>
            </div>
          ) : null}

          <Suspense fallback={null}>
            <StudentsFilters
              classes={data.classes}
              filters={{
                search: data.filters.search,
                classId: data.filters.classId,
                status: data.filters.status ?? 'all',
                unassignedOnly: data.filters.unassignedOnly,
              }}
            />
          </Suspense>

          {data.directory && data.directory.total === 0 && !data.filters.search ? (
            <div className="rounded-lg border border-dashed px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun élève inscrit pour {data.activeYear.name}.
              </p>
              <ButtonLink href="/school/eleves/nouveau" className="mt-4 gap-1.5" size="sm">
                <Plus className="size-4" aria-hidden />
                Première inscription
              </ButtonLink>
            </div>
          ) : data.directory ? (
            <>
              <StudentsTable rows={data.directory.rows} />
              <StudentsPagination
                page={data.directory.page}
                pageSize={data.directory.pageSize}
                total={data.directory.total}
                searchParams={params}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
