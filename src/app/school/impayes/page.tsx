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
    <div className="mx-auto w-full max-w-5xl space-y-0 pb-8">
      {!data.activeYear ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link href="/school/parametres#referentiels" className="font-medium text-wa-accent underline">
              année scolaire active
            </Link>{' '}
            et des frais.
          </AlertDescription>
        </Alert>
      ) : data.fees.length === 0 ? (
        <Alert className="mx-4 mt-4">
          <AlertDescription>
            Aucun frais défini pour {data.activeYear.name}. Ajoutez des frais dans les{' '}
            <Link href="/school/parametres#referentiels" className="font-medium text-wa-accent underline">
              référentiels
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="border-b border-wa-divider bg-wa-panel p-4">
            {data.stats ? <ImpayesStatsCards stats={data.stats} /> : null}
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
