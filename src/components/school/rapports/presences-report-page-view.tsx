'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  CheckCircle2,
  UserX,
  Clock3,
  HelpCircle,
} from 'lucide-react';
import type { AttendanceReportData } from '@/lib/db/attendance-reports';
import { PresencesReportFilters } from '@/components/school/rapports/presences-report-filters';
import { ReportPageShell } from '@/components/school/rapports/report-page-shell';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type IssueFilter = 'all' | 'absent' | 'late' | 'unmarked';

import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  data: AttendanceReportData | null;
  reportsBase?: string;
};

export function PresencesReportPageView({
  data,
  reportsBase = SCHOOL_REPORTS_BASE,
}: Props) {
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('all');

  const filteredIssues = useMemo(() => {
    if (!data) return [];
    if (issueFilter === 'all') return data.issueRows;
    if (issueFilter === 'unmarked') {
      return data.issueRows.filter((row) => !row.status);
    }
    return data.issueRows.filter((row) => row.status === issueFilter);
  }, [data, issueFilter]);

  const selectedClass = data?.selectedClassId
    ? data.classes.find((c) => c.id === data.selectedClassId)
    : null;

  const formattedDate = data
    ? new Date(`${data.selectedDate}T12:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const presentRate =
    data && data.totals.enrolled > 0
      ? Math.round((data.totals.present / data.totals.enrolled) * 100)
      : 0;

  const allPresent =
    data !== null &&
    data.totals.enrolled > 0 &&
    data.issueRows.length === 0;

  return (
    <ReportPageShell
      title="Rapport du jour"
      subtitle={
        data?.activeYear
          ? `Année ${data.activeYear.name} — absences et retards pour une date.`
          : 'Activez une année scolaire pour consulter les rapports.'
      }
      backHref={reportHref(reportsBase, 'presences')}
      backLabel="Rapports présences"
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
            <p className="text-lg font-semibold">Rapport présences</p>
            <p className="text-sm capitalize text-muted-foreground">{formattedDate}</p>
            <p className="text-sm text-muted-foreground">
              Année {data.activeYear?.name}
              {selectedClass
                ? ` · ${classDisplayLabel(selectedClass.level, selectedClass.name)}`
                : ' · Toutes les classes'}
            </p>
          </div>

          <Suspense fallback={null}>
            <div className="no-print rounded-2xl border bg-card p-4 shadow-sm">
              <PresencesReportFilters
                basePath={reportHref(reportsBase, 'presences', 'jour')}
                classes={data.classes}
                selectedClassId={data.selectedClassId}
                selectedDate={data.selectedDate}
              />
            </div>
          </Suspense>

          <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/8 via-card to-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Synthèse · <span className="capitalize">{formattedDate}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  {data.totals.present}
                  <span className="text-lg font-normal text-muted-foreground">
                    {' '}
                    / {data.totals.enrolled} présents
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedClass
                    ? classDisplayLabel(selectedClass.level, selectedClass.name)
                    : 'Toutes les classes'}
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums text-secondary">
                {presentRate} %
              </p>
            </div>
            {data.totals.enrolled > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${presentRate}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <SummaryChip
                    label={`${data.totals.absent} absent${data.totals.absent > 1 ? 's' : ''}`}
                    tone="destructive"
                  />
                  <SummaryChip
                    label={`${data.totals.late} retard${data.totals.late > 1 ? 's' : ''}`}
                    tone="amber"
                  />
                  <SummaryChip
                    label={`${data.totals.unmarked} non marqué${data.totals.unmarked > 1 ? 's' : ''}`}
                    tone="muted"
                  />
                  <SummaryChip
                    label={`${data.totals.markedRate} % marqués`}
                    tone="neutral"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {data.classSummaries.length > 0 && !data.selectedClassId ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Par classe
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.classSummaries.map((row) => {
                  const rate =
                    row.enrolled > 0
                      ? Math.round((row.present / row.enrolled) * 100)
                      : 0;
                  return (
                    <div
                      key={row.class_id}
                      className="rounded-xl border bg-card px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug">
                          {classDisplayLabel(row.class_level, row.class_name)}
                        </p>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary">
                          {rate} %
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{row.present} présents</span>
                        {row.absent > 0 ? (
                          <span className="text-destructive">{row.absent} absents</span>
                        ) : null}
                        {row.late > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {row.late} retards
                          </span>
                        ) : null}
                        {row.unmarked > 0 ? (
                          <span>{row.unmarked} non marqués</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium">À traiter</h2>
              <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
                <FilterTab
                  active={issueFilter === 'all'}
                  onClick={() => setIssueFilter('all')}
                  label="Tous"
                  count={data.issueRows.length}
                />
                <FilterTab
                  active={issueFilter === 'absent'}
                  onClick={() => setIssueFilter('absent')}
                  label="Absents"
                  count={data.totals.absent}
                />
                <FilterTab
                  active={issueFilter === 'late'}
                  onClick={() => setIssueFilter('late')}
                  label="Retards"
                  count={data.totals.late}
                />
                <FilterTab
                  active={issueFilter === 'unmarked'}
                  onClick={() => setIssueFilter('unmarked')}
                  label="Non marqués"
                  count={data.totals.unmarked}
                />
              </div>
            </div>

            {allPresent ? (
              <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 px-6 py-10 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <CheckCircle2
                  className="mx-auto size-8 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <p className="mt-3 font-medium text-emerald-800 dark:text-emerald-300">
                  Tous les élèves sont présents
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aucune absence, retard ou oubli pour cette sélection.
                </p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <p className="rounded-xl border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Aucun élève dans cette catégorie.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredIssues.map((row) => {
                  const statusKey: 'absent' | 'late' | 'unmarked' =
                    row.status === 'absent' || row.status === 'late'
                      ? row.status
                      : 'unmarked';
                  return (
                    <article
                      key={row.student_id}
                      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm"
                    >
                      <IssueIcon status={statusKey} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {studentFullName(row.last_name, row.first_name)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {classDisplayLabel(row.class_level, row.class_name)}
                          {row.matricule ? ` · ${row.matricule}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={statusKey} />
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </ReportPageShell>
  );
}

function SummaryChip({
  label,
  tone,
}: {
  label: string;
  tone: 'destructive' | 'amber' | 'muted' | 'neutral';
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 font-medium',
        tone === 'destructive' && 'bg-destructive/10 text-destructive',
        tone === 'amber' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        tone === 'muted' && 'bg-muted text-muted-foreground',
        tone === 'neutral' && 'bg-primary/10 text-primary',
      )}
    >
      {label}
    </span>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      <span className="ml-1 tabular-nums text-muted-foreground">({count})</span>
    </button>
  );
}

function IssueIcon({ status }: { status: 'absent' | 'late' | 'unmarked' }) {
  const Icon =
    status === 'absent' ? UserX : status === 'late' ? Clock3 : HelpCircle;
  const tone =
    status === 'absent'
      ? 'bg-destructive/10 text-destructive'
      : status === 'late'
        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
        : 'bg-muted text-muted-foreground';

  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full',
        tone,
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

function StatusBadge({ status }: { status: 'absent' | 'late' | 'unmarked' }) {
  const labels = {
    absent: 'Absent',
    late: 'Retard',
    unmarked: 'Non marqué',
  };
  const styles = {
    absent: 'bg-destructive/10 text-destructive',
    late: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    unmarked: 'bg-muted text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'hidden shrink-0 rounded-md px-2 py-1 text-xs font-medium sm:inline-flex',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
