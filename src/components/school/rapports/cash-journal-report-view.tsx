'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import type { CashJournalReportData } from '@/lib/db/finance-reports';
import { CashDateFilters } from '@/components/school/rapports/cash-date-filters';
import { ReportPageShell } from '@/components/school/rapports/report-page-shell';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import { cashTotalLabel } from '@/lib/school/fee-currencies';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  data: CashJournalReportData | null;
  reportsBase?: string;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CashJournalReportView({
  data,
  reportsBase = SCHOOL_REPORTS_BASE,
}: Props) {
  const formattedDate = data
    ? new Date(`${data.selectedDate}T12:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <ReportPageShell
      title="Journal de caisse"
      subtitle={
        data?.activeYear
          ? `Année ${data.activeYear.name} — encaissements du jour.`
          : 'Activez une année scolaire pour consulter le journal.'
      }
      backHref={reportHref(reportsBase, 'caisse')}
      backLabel="Rapports caisse"
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
      ) : (
        <>
          <div className="print-only mb-4 hidden border-b pb-4 print:block">
            <p className="text-lg font-semibold">Journal de caisse</p>
            <p className="text-sm capitalize text-muted-foreground">{formattedDate}</p>
            <p className="text-sm text-muted-foreground">Année {data.activeYear.name}</p>
          </div>

          <Suspense fallback={null}>
            <div className="no-print rounded-2xl border bg-card p-4 shadow-sm">
              <CashDateFilters
                basePath={reportHref(reportsBase, 'caisse', 'journal')}
                selectedDate={data.selectedDate}
              />
            </div>
          </Suspense>

          <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-500/8 via-card to-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Synthèse · <span className="capitalize">{formattedDate}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  {data.totals.count}
                  <span className="text-lg font-normal text-muted-foreground">
                    {' '}
                    encaissement{data.totals.count > 1 ? 's' : ''}
                  </span>
                </p>
              </div>
              {data.feeCurrencies.map((currency) => {
                const amount =
                  currency === 'USD' ? data.totals.usd : data.totals.cdf;
                return (
                  <div key={currency}>
                    <p className="text-2xl font-semibold tabular-nums">
                      {formatFeeAmount(amount, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cashTotalLabel(currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {data.rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun encaissement enregistré pour cette date.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Heure</th>
                    <th className="px-4 py-2.5 font-medium">Reçu</th>
                    <th className="px-4 py-2.5 font-medium">Élève</th>
                    <th className="px-4 py-2.5 font-medium">Classe</th>
                    <th className="px-4 py-2.5 font-medium">Frais</th>
                    <th className="px-4 py-2.5 font-medium text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                        {formatTime(row.created_at)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{row.receipt_number}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium">
                          {studentFullName(row.last_name, row.first_name)}
                        </span>
                        {row.matricule ? (
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {row.matricule}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {row.class_level && row.class_name
                          ? classDisplayLabel(row.class_level, row.class_name)
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">{row.fee_name}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                        {formatFeeAmount(row.amount_paid, row.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ReportPageShell>
  );
}
