'use client';

import Link from 'next/link';
import type { EnrollmentReportData } from '@/lib/db/finance-reports';
import { ReportPageShell } from '@/components/school/rapports/report-page-shell';
import { classDisplayLabel } from '@/lib/school/students/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Props = {
  data: EnrollmentReportData | null;
};

function fillTone(rate: number): string {
  if (rate >= 90) return 'bg-destructive';
  if (rate >= 75) return 'bg-orange-500';
  return 'bg-emerald-500';
}

export function EnrollmentReportView({ data }: Props) {
  return (
    <ReportPageShell
      title="Effectifs par classe"
      subtitle={
        data?.activeYear
          ? `Année ${data.activeYear.name} — inscrits et taux de remplissage.`
          : 'Activez une année scolaire pour consulter les effectifs.'
      }
      backHref="/school/rapports"
      backLabel="Rapports"
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
            et des classes.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="print-only mb-4 hidden border-b pb-4 print:block">
            <p className="text-lg font-semibold">Effectifs par classe</p>
            <p className="text-sm text-muted-foreground">
              {data.schoolName} · Année {data.activeYear.name}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-500/8 via-card to-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Synthèse globale
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  {data.totals.enrolled}
                  <span className="text-lg font-normal text-muted-foreground">
                    {' '}
                    inscrit{data.totals.enrolled > 1 ? 's' : ''}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {data.totals.class_count}
                </p>
                <p className="text-xs text-muted-foreground">Classes</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {data.totals.capacity > 0
                    ? Math.round((data.totals.enrolled / data.totals.capacity) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">
                  Remplissage ({data.totals.enrolled}/{data.totals.capacity})
                </p>
              </div>
            </div>
          </div>

          {data.byCycle.length > 1 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.byCycle.map((cycle) => (
                <div key={cycle.cycle} className="rounded-xl border bg-muted/20 px-4 py-3">
                  <p className="text-sm font-medium">{cycle.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{cycle.enrolled}</p>
                  <p className="text-xs text-muted-foreground">
                    {cycle.class_count} classe{cycle.class_count > 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {data.rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
              Aucune classe configurée pour cette année.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Classe</th>
                    <th className="px-4 py-2.5 font-medium">Cycle</th>
                    <th className="px-4 py-2.5 font-medium text-right">Inscrits</th>
                    <th className="px-4 py-2.5 font-medium text-right">Capacité</th>
                    <th className="px-4 py-2.5 font-medium">Remplissage</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.rows.map((row) => (
                    <tr key={row.class_id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">
                        {classDisplayLabel(row.class_level, row.class_name)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {data.byCycle.find((c) => c.cycle === row.cycle)?.label ?? row.cycle}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{row.enrolled}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {row.max_capacity}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn('h-full rounded-full', fillTone(row.fill_rate))}
                              style={{ width: `${Math.min(row.fill_rate, 100)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                            {row.fill_rate}%
                          </span>
                        </div>
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
