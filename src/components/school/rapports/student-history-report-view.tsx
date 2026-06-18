'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { StudentAttendanceHistoryData } from '@/lib/db/attendance-reports-ext';
import { ReportPageShell } from '@/components/school/rapports/report-page-shell';
import { StudentSearchField } from '@/components/school/students/student-search-field';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  data: StudentAttendanceHistoryData | null;
  reportsBase?: string;
};

const STATUS_LABELS = {
  present: 'Présent',
  absent: 'Absent',
  late: 'Retard',
} as const;

function formatLongDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function StudentHistoryReportView({
  data,
  reportsBase = SCHOOL_REPORTS_BASE,
}: Props) {
  const [search, setSearch] = useState('');
  const basePath = reportHref(reportsBase, 'presences', 'eleve');

  return (
    <ReportPageShell
      title="Historique élève"
      subtitle={
        data?.activeYear
          ? `Année ${data.activeYear.name} — journal de présence par élève.`
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
            <div className="no-print space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
              <StudentPicker
                search={search}
                onSearchChange={setSearch}
                selectedStudentId={data.student?.id ?? null}
                basePath={basePath}
              />
              <DateRangeFilters
                startDate={data.startDate}
                endDate={data.endDate}
                studentId={data.student?.id ?? null}
                basePath={basePath}
              />
            </div>
          </Suspense>

          {!data.student ? (
            <p className="rounded-xl border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              Recherchez et sélectionnez un élève pour afficher son historique.
            </p>
          ) : (
            <>
              <div className="rounded-2xl border bg-muted/20 px-5 py-4">
                <p className="font-medium">
                  {studentFullName(data.student.last_name, data.student.first_name)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {classDisplayLabel(data.student.class_level, data.student.class_name)}
                  {data.student.matricule ? ` · ${data.student.matricule}` : ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Chip label={`${data.summary.present} présents`} tone="success" />
                  <Chip label={`${data.summary.absent} absents`} tone="destructive" />
                  <Chip label={`${data.summary.late} retards`} tone="amber" />
                  <Chip label={`${data.summary.unmarked} jours non marqués`} tone="muted" />
                </div>
              </div>

              {data.records.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune présence enregistrée sur cette période.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.records.map((record) => (
                    <article
                      key={record.date}
                      className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm"
                    >
                      <p className="text-sm font-medium capitalize">
                        {formatLongDate(record.date)}
                      </p>
                      <span
                        className={cn(
                          'rounded-md px-2 py-1 text-xs font-medium',
                          record.status === 'present' &&
                            'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                          record.status === 'absent' && 'bg-destructive/10 text-destructive',
                          record.status === 'late' &&
                            'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                        )}
                      >
                        {STATUS_LABELS[record.status]}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </ReportPageShell>
  );
}

function StudentPicker({
  search,
  onSearchChange,
  selectedStudentId,
  basePath,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStudentId: string | null;
  basePath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectStudent(studentId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('eleve', studentId);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <StudentSearchField
      value={search}
      onChange={onSearchChange}
      onSelectStudent={selectStudent}
      label="Rechercher un élève"
      inputId="history-student"
    />
  );
}

function DateRangeFilters({
  startDate,
  endDate,
  studentId,
  basePath,
}: {
  startDate: string;
  endDate: string;
  studentId: string | null;
  basePath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function pushDates(next: { debut?: string; fin?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (studentId) params.set('eleve', studentId);
    if (next.debut !== undefined) {
      if (next.debut) params.set('debut', next.debut);
      else params.delete('debut');
    }
    if (next.fin !== undefined) {
      if (next.fin) params.set('fin', next.fin);
      else params.delete('fin');
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="history-start">Du</Label>
        <Input
          id="history-start"
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => pushDates({ debut: e.target.value })}
          className="bg-background"
          disabled={!studentId}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="history-end">Au</Label>
        <Input
          id="history-end"
          type="date"
          value={endDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => pushDates({ fin: e.target.value })}
          className="bg-background"
          disabled={!studentId}
        />
      </div>
    </div>
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
