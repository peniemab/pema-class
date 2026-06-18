'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import type { WeeklyAttendanceReportData } from '@/lib/db/attendance-reports-ext';
import { PresencesReportFilters } from '@/components/school/rapports/presences-report-filters';
import { ReportPageShell } from '@/components/school/rapports/report-page-shell';
import { classDisplayLabel } from '@/lib/school/students/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  data: WeeklyAttendanceReportData | null;
  reportsBase?: string;
};

function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function WeeklyPresencesReportView({
  data,
  reportsBase = SCHOOL_REPORTS_BASE,
}: Props) {
  return (
    <ReportPageShell
      title="Synthèse hebdomadaire"
      subtitle={
        data
          ? `Année ${data.activeYear.name} — taux cumulé sur ${data.dayCount} jour${data.dayCount > 1 ? 's' : ''}.`
          : 'Activez une année scolaire pour consulter les rapports.'
      }
      backHref={reportHref(reportsBase, 'presences')}
      backLabel="Rapports présences"
    >
      {!data ? (
        <Alert>
          <AlertDescription>
            Configurez d&apos;abord une{' '}
            <Link href="/school/parametres#referentiels" className="font-medium text-primary underline">
              année scolaire active
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Suspense fallback={null}>
            <div className="no-print rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-3 text-xs text-muted-foreground">
                Semaine du {formatShortDate(data.weekStart)} au{' '}
                {formatShortDate(data.weekEnd)}
              </p>
              <PresencesReportFilters
                basePath={reportHref(reportsBase, 'presences', 'hebdo')}
                classes={data.classes}
                selectedClassId={data.selectedClassId}
                selectedDate={data.anchorDate}
              />
            </div>
          </Suspense>

          <div className="rounded-2xl border bg-gradient-to-br from-primary/8 via-card to-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Semaine · {formatShortDate(data.weekStart)} → {formatShortDate(data.weekEnd)}
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {data.totals.attendanceRate} %
              <span className="text-lg font-normal text-muted-foreground">
                {' '}
                de présence
              </span>
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${data.totals.attendanceRate}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Chip label={`${data.totals.present} présences`} tone="success" />
              <Chip label={`${data.totals.absent} absences`} tone="destructive" />
              <Chip label={`${data.totals.late} retards`} tone="amber" />
              <Chip label={`${data.totals.unmarked} non marqués`} tone="muted" />
            </div>
          </div>

          {data.classSummaries.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Par classe</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.classSummaries.map((row) => (
                  <div
                    key={row.class_id}
                    className="rounded-xl border bg-card px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">
                        {classDisplayLabel(row.class_level, row.class_name)}
                      </p>
                      <span className="text-sm font-semibold tabular-nums text-secondary">
                        {row.attendanceRate} %
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${row.attendanceRate}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {row.enrolled} élève{row.enrolled > 1 ? 's' : ''} · {row.present}{' '}
                      présences · {row.absent} absences · {row.late} retards
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune donnée pour cette sélection.
            </p>
          )}
        </>
      )}
    </ReportPageShell>
  );
}

function Chip({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'destructive' | 'amber' | 'muted';
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 font-medium',
        tone === 'success' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        tone === 'destructive' && 'bg-destructive/10 text-destructive',
        tone === 'amber' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        tone === 'muted' && 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}
