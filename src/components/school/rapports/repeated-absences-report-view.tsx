'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { UserX } from 'lucide-react';
import type { RepeatedAbsencesReportData } from '@/lib/db/attendance-reports-ext';
import {
  ReportClassFilter,
  ReportPeriodToggle,
} from '@/components/school/rapports/report-filters';
import { ReportPageShell } from '@/components/school/rapports/report-page-shell';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { useRouter, useSearchParams } from 'next/navigation';
import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  data: RepeatedAbsencesReportData | null;
  reportsBase?: string;
  onFiltersChange?: (params: {
    periode?: number;
    min?: number;
    classe?: string;
  }) => void;
};

function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RepeatedAbsencesReportView({
  data,
  reportsBase = SCHOOL_REPORTS_BASE,
  onFiltersChange,
}: Props) {
  const basePath = reportHref(reportsBase, 'presences', 'absences-repetees');

  return (
    <ReportPageShell
      title="Absences répétées"
      subtitle={
        data
          ? `Élèves absents au moins ${data.minAbsences} fois sur ${data.periodDays} jours.`
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
              <ReportPeriodToggle
                basePath={basePath}
                periodDays={data.periodDays}
                options={[
                  { value: 7, label: '7 jours' },
                  { value: 30, label: '30 jours' },
                ]}
                onPeriodChange={(days) => onFiltersChange?.({ periode: days })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <MinAbsencesFilter
                  minAbsences={data.minAbsences}
                  basePath={basePath}
                  onMinChange={(min) => onFiltersChange?.({ min })}
                />
                <ReportClassFilter
                  basePath={basePath}
                  classes={data.classes}
                  selectedClassId={data.selectedClassId}
                  onClassChange={(classId) =>
                    onFiltersChange?.({ classe: classId ?? undefined })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Période : {formatShortDate(data.periodStart)} →{' '}
                {formatShortDate(data.periodEnd)}
              </p>
            </div>
          </Suspense>

          <div className="rounded-2xl border bg-muted/20 px-5 py-4">
            <p className="text-2xl font-semibold tabular-nums">{data.rows.length}</p>
            <p className="text-sm text-muted-foreground">
              élève{data.rows.length > 1 ? 's' : ''} avec {data.minAbsences}+ absences
            </p>
          </div>

          {data.rows.length === 0 ? (
            <p className="rounded-xl border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Aucun élève ne dépasse ce seuil sur la période sélectionnée.
            </p>
          ) : (
            <div className="space-y-2">
              {data.rows.map((row) => (
                <article
                  key={row.student_id}
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <UserX className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {studentFullName(row.last_name, row.first_name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {classDisplayLabel(row.class_level, row.class_name)}
                      {row.matricule ? ` · ${row.matricule}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold tabular-nums text-destructive">
                      {row.absent_count} abs.
                    </p>
                    {row.late_count > 0 ? (
                      <p className="text-muted-foreground">{row.late_count} ret.</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </ReportPageShell>
  );
}

function MinAbsencesFilter({
  minAbsences,
  basePath,
  onMinChange,
}: {
  minAbsences: number;
  basePath: string;
  onMinChange?: (min: number) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="space-y-2">
      <Label htmlFor="min-absences">Seuil minimum d&apos;absences</Label>
      <NativeSelect
        id="min-absences"
        value={String(minAbsences)}
        onChange={(e) => {
          const min = Number(e.target.value);
          if (onMinChange) {
            onMinChange(min);
            return;
          }
          const params = new URLSearchParams(searchParams.toString());
          params.set('min', e.target.value);
          router.push(`${basePath}?${params.toString()}`);
        }}
        className="bg-background"
      >
        {[2, 3, 5, 7].map((n) => (
          <option key={n} value={n}>
            {n} absences ou plus
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
