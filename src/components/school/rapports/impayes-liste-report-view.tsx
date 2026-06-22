'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { ImpayesReportData } from '@/lib/db/finance-reports';
import { ImpayesReportFilters } from '@/components/school/rapports/impayes-report-filters';
import { ReportPageShell } from '@/components/school/rapports/report-page-shell';
import { ImpayesTable } from '@/components/school/impayes/impayes-table';
import {
  formatDualMoney,
  getSchoolFeeCurrencies,
} from '@/lib/school/fee-currencies';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  data: ImpayesReportData | null;
  search?: string;
  reportsBase?: string;
  onFiltersChange?: (params: {
    q?: string;
    classe?: string;
    frais?: string;
  }) => void;
};

export function ImpayesListeReportView({
  data,
  search,
  reportsBase = SCHOOL_REPORTS_BASE,
  onFiltersChange,
}: Props) {
  const feeCurrencies = data ? getSchoolFeeCurrencies(data.fees) : [];

  return (
    <ReportPageShell
      title="Liste des impayés"
      subtitle={
        data?.activeYear
          ? `Année ${data.activeYear.name} — élèves avec reste à payer.`
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
            Aucun frais défini pour {data.activeYear.name}.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="print-only mb-4 hidden border-b pb-4 print:block">
            <p className="text-lg font-semibold">Liste des impayés</p>
            <p className="text-sm text-muted-foreground">Année {data.activeYear.name}</p>
            <p className="text-sm text-muted-foreground">
              {data.stats.studentsWithDebt} élève
              {data.stats.studentsWithDebt > 1 ? 's' : ''} ·{' '}
              {formatDualMoney(
                {
                  cdf: data.stats.totalUnpaidCdf,
                  usd: data.stats.totalUnpaidUsd,
                },
                feeCurrencies,
              )}
            </p>
          </div>

          <Suspense fallback={null}>
            <div className="no-print rounded-2xl border bg-card p-4 shadow-sm">
              <ImpayesReportFilters
                basePath={reportHref(reportsBase, 'impayes', 'liste')}
                classes={data.classes}
                fees={data.fees}
                selectedClassId={data.selectedClassId}
                selectedFeeId={data.selectedFeeId}
                search={search}
                onFiltersChange={onFiltersChange}
              />
            </div>
          </Suspense>

          <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-orange-500/8 via-card to-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Synthèse
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
              {data.stats.studentsWithDebt}
              <span className="text-lg font-normal text-muted-foreground">
                {' '}
                élève{data.stats.studentsWithDebt > 1 ? 's' : ''} en dette
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Total impayé :{' '}
              {formatDualMoney(
                {
                  cdf: data.stats.totalUnpaidCdf,
                  usd: data.stats.totalUnpaidUsd,
                },
                feeCurrencies,
              )}
            </p>
          </div>

          {data.stats.studentsWithDebt === 0 ? (
            <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 px-6 py-10 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <CheckCircle2
                className="mx-auto size-8 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              <p className="mt-3 font-medium text-emerald-800 dark:text-emerald-300">
                Tous les élèves inscrits sont à jour
              </p>
            </div>
          ) : (
            <ImpayesTable rows={data.rows} feeCurrencies={feeCurrencies} />
          )}
        </>
      )}
    </ReportPageShell>
  );
}
