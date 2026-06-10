'use client';

import { useMemo, useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { AttendancePageData } from '@/lib/db/attendance-page';
import type { AttendanceStatus } from '@/lib/db/attendances';
import { saveAttendanceAction } from '@/lib/school/attendance-actions';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  activeClass: string;
}[] = [
  {
    value: 'present',
    label: 'Présent',
    activeClass: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    value: 'late',
    label: 'Retard',
    activeClass: 'bg-amber-500 text-white border-amber-500',
  },
  {
    value: 'absent',
    label: 'Absent',
    activeClass: 'bg-destructive text-white border-destructive',
  },
];

type Props = {
  data: AttendancePageData;
  basePath: '/school/presences' | '/app/presences';
};

type LocalRow = {
  student_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  status: AttendanceStatus | null;
};

export function PresencesPanel({ data, basePath }: Props) {
  const [rows, setRows] = useState<LocalRow[]>(() =>
    data.rows.map((r) => ({ ...r })),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedClass = useMemo(
    () => data.classes.find((c) => c.id === data.selectedClassId) ?? null,
    [data.classes, data.selectedClassId],
  );

  const dirtyCount = rows.filter((r) => r.status !== null).length;

  function setStatus(studentId: string, status: AttendanceStatus) {
    setError(null);
    setMessage(null);
    setRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r)),
    );
  }

  function markAllPresent() {
    setError(null);
    setMessage(null);
    setRows((prev) => prev.map((r) => ({ ...r, status: 'present' as const })));
  }

  function handleSave() {
    if (!data.selectedClassId) return;
    const entries = rows
      .filter((r): r is LocalRow & { status: AttendanceStatus } => r.status !== null)
      .map((r) => ({ studentId: r.student_id, status: r.status }));

    if (entries.length === 0) {
      setError('Marquez au moins un élève avant d\'enregistrer.');
      return;
    }

    startTransition(async () => {
      const result = await saveAttendanceAction({
        classId: data.selectedClassId!,
        date: data.selectedDate,
        entries,
        basePath,
      });
      if (!result.ok) {
        setError(result.error);
        setMessage(null);
        return;
      }
      setError(null);
      setMessage(`${result.saved} présence${result.saved > 1 ? 's' : ''} enregistrée${result.saved > 1 ? 's' : ''}.`);
    });
  }

  if (!data.selectedClassId || !selectedClass) {
    return null;
  }

  return (
    <div className="space-y-0">
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-wa-divider bg-wa-panel px-4 py-3">
        <p className="text-sm text-wa-text-secondary">
          {classDisplayLabel(selectedClass.level, selectedClass.name)} ·{' '}
          {data.rows.length} élève{data.rows.length > 1 ? 's' : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={markAllPresent}>
            Tous présents
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={pending || dirtyCount === 0}
            className="gap-1.5 bg-primary hover:bg-primary-dark"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {error ? <p className="px-4 pt-3 text-sm text-destructive">{error}</p> : null}
      {message ? (
        <p className="px-4 pt-3 text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
      ) : null}

      <div className="divide-y divide-wa-divider border-y border-wa-divider bg-wa-panel">
        {rows.map((row, index) => (
          <div key={row.student_id} className="flex flex-col gap-3 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-wa-text-primary">
                  {studentFullName(row.last_name, row.first_name)}
                </p>
                {row.matricule ? (
                  <p className="text-xs tabular-nums text-wa-text-secondary">{row.matricule}</p>
                ) : null}
              </div>
              <span className="text-xs tabular-nums text-wa-text-secondary">{index + 1}</span>
            </div>
            <div className="flex max-w-xl gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(row.student_id, opt.value)}
                  className={cn(
                    'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors',
                    row.status === opt.value
                      ? opt.activeClass
                      : 'border-wa-divider bg-wa-bg text-wa-text-secondary hover:bg-wa-row-hover',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
