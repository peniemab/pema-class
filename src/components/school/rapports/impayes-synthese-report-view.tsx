'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { ImpayesReportData } from '@/lib/db/finance-reports';
import { ImpayesStatsCards } from '@/components/school/impayes/impayes-stats';
import { ReportPageShell } from '@/components/school/rapports/report-page-shell';
import { getSchoolFeeCurrencies } from '@/lib/school/fee-currencies';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  data: ImpayesReportData | null;
  reportsBase?: string;
};

export function ImpayesSyntheseReportView({
  data,
  reportsBase = SCHOOL_REPORTS_BASE,
}: Props) {
  const feeCurrencies = data ? getSchoolFeeCurrencies(data.fees) : [];

  return (
    <ReportPageShell
      title="Synthèse impayés"
      subtitle={
        data?.activeYear
          ? `Année ${data.activeYear.name} — KPIs et répartition par frais.`
          : 'Activez une année scolaire pour consulter les impayés.'
      }
      backHref={reportHref(reportsBase, 'impayes')}
      backLabel="Rapports impayés"
    >
      {!data ? (
        <Alert>
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link
              href="/school/parametres#referentiels"
              className="font-medium text-primary underline"
            >
              année scolaire active
            </Link>{' '}
            et des frais.
          </AlertDescription>
        </Alert>
      ) : data.fees.length === 0 ? (
        <Alert>
          <AlertDescription>
            Aucun frais défini pour {data.activeYear.name}. Ajoutez des frais dans les{' '}
            <Link
              href="/school/parametres#referentiels"
              className="font-medium text-primary underline"
            >
              référentiels
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="print-only mb-4 hidden border-b pb-4 print:block">
            <p className="text-lg font-semibold">Synthèse impayés</p>
            <p className="text-sm text-muted-foreground">Année {data.activeYear.name}</p>
          </div>

          <ImpayesStatsCards stats={data.stats} feeCurrencies={feeCurrencies} />

          {data.stats.studentsWithDebt === 0 ? (
            <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 px-6 py-10 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
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
    </ReportPageShell>
  );
}
