import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { loadImpayesPage } from '@/lib/school/load-impayes-page';
import { ImpayesStatsCards } from '@/components/school/impayes/impayes-stats';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SchoolImpayesPage(_props: Props) {
  const data = await loadImpayesPage({});

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Impayés</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.activeYear
            ? `Année ${data.activeYear.name} — vue d'ensemble des frais et relances.`
            : 'Activez une année scolaire pour consulter les impayés.'}
        </p>
      </div>

      {!data.activeYear ? (
        <Alert>
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link href="/school/parametres/referentiels" className="font-medium text-primary underline">
              année scolaire active
            </Link>{' '}
            et des frais.
          </AlertDescription>
        </Alert>
      ) : data.fees.length === 0 ? (
        <Alert>
          <AlertDescription>
            Aucun frais défini pour {data.activeYear.name}. Ajoutez des frais dans les{' '}
            <Link href="/school/parametres/referentiels" className="font-medium text-primary underline">
              référentiels
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {data.stats ? <ImpayesStatsCards stats={data.stats} /> : null}

          {data.stats && data.stats.studentsWithDebt === 0 ? (
            <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/40 px-6 py-10 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <CheckCircle2
                className="mx-auto size-8 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              <p className="mt-3 font-medium text-emerald-800 dark:text-emerald-300">
                Tous les élèves inscrits sont à jour
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Aucun frais en attente pour {data.activeYear.name}.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
