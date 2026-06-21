'use client';

import { useMemo, useState, useTransition } from 'react';
import { Check, Clock, Loader2, UserX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  shortLabel: string;
  icon: LucideIcon;
  activeClass: string;
}[] = [
  {
    value: 'present',
    label: 'Présent',
    shortLabel: 'Pr.',
    icon: Check,
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
  },
  {
    value: 'late',
    label: 'Retard',
    shortLabel: 'Rt.',
    icon: Clock,
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-sm',
  },
  {
    value: 'absent',
    label: 'Absent',
    shortLabel: 'Ab.',
    icon: UserX,
    activeClass: 'bg-destructive text-white border-destructive shadow-sm',
  },
];

type Props = {
  data: AttendancePageData;
  basePath: '/school/presences' | '/app/presences';
  /** Mode offline : enregistrement local + outbox au lieu du server action. */
  onSaveLocal?: (input: {
    classId: string;
    date: string;
    entries: { studentId: string; status: AttendanceStatus }[];
  }) => Promise<
    | { ok: true; saved: number }
    | { ok: false; error: string }
  >;
};

type LocalRow = {
  student_id: string;
  first_name: string;
  last_name: string;
  matricule: string | null;
  status: AttendanceStatus | null;
};

export function PresencesPanel({ data, basePath, onSaveLocal }: Props) {
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

  const markedCount = rows.filter((r) => r.status !== null).length;
  const allMarked = markedCount === rows.length && rows.length > 0;

  function setStatus(studentId: string, status: AttendanceStatus) {
    setError(null);
    setMessage(null);
    setRows((prev) =>
      prev.map((r) =>
        r.student_id === studentId
          ? { ...r, status: r.status === status ? null : status }
          : r,
      ),
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
      const payload = {
        classId: data.selectedClassId!,
        date: data.selectedDate,
        entries,
      };

      const result = onSaveLocal
        ? await onSaveLocal(payload)
        : await saveAttendanceAction({ ...payload, basePath });

      if (!result.ok) {
        setError(result.error);
        setMessage(null);
        return;
      }
      setError(null);
      setMessage(
        `${result.saved} présence${result.saved > 1 ? 's' : ''} enregistrée${result.saved > 1 ? 's' : ''}.`,
      );
    });
  }

  if (!data.selectedClassId || !selectedClass) {
    return null;
  }

  return (
    <div className="space-y-0">
      <div className="sticky top-14 z-20 border-b border-wa-divider bg-wa-panel/95 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="type-toolbar truncate text-wa-text-primary">
              {classDisplayLabel(selectedClass.level, selectedClass.name)}
            </p>
            <p className="type-caption mt-0.5">
              {markedCount}/{rows.length} marqué{markedCount > 1 ? 's' : ''}
              {allMarked ? ' · prêt à enregistrer' : ''}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markAllPresent}
              className="h-9 px-2.5 text-xs sm:h-8 sm:px-3 sm:text-sm"
            >
              Tous présents
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={pending || markedCount === 0}
              className="h-9 gap-1 bg-primary px-2.5 text-xs hover:bg-primary-dark sm:h-8 sm:px-3 sm:text-sm"
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
      </div>

      {error ? (
        <p className="type-caption px-3 pt-2 text-destructive sm:px-4">{error}</p>
      ) : null}
      {message ? (
        <p className="type-caption px-3 pt-2 text-emerald-700 sm:px-4">{message}</p>
      ) : null}

      <div
        className="hidden border-b border-wa-divider bg-muted/30 px-3 py-2 sm:grid sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:px-4 md:grid-cols-[2.5rem_minmax(0,1fr)_auto]"
        aria-hidden
      >
        <span className="type-caption text-center">#</span>
        <span className="type-label text-muted-foreground">Élève</span>
        <span className="type-label text-right text-muted-foreground">Statut</span>
      </div>

      <ul className="divide-y divide-wa-divider border-b border-wa-divider bg-wa-panel">
        {rows.map((row, index) => (
          <AttendanceRow
            key={row.student_id}
            index={index}
            row={row}
            onSetStatus={setStatus}
          />
        ))}
      </ul>
    </div>
  );
}

function AttendanceRow({
  index,
  row,
  onSetStatus,
}: {
  index: number;
  row: LocalRow;
  onSetStatus: (studentId: string, status: AttendanceStatus) => void;
}) {
  const name = studentFullName(row.last_name, row.first_name);

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
      <span
        className="type-list-meta w-6 shrink-0 text-center tabular-nums sm:w-7"
        aria-hidden
      >
        {index + 1}
      </span>

      <div className="min-w-0">
        <p className="type-list-title truncate text-wa-text-primary" title={name}>
          {name}
        </p>
        {row.matricule ? (
          <p className="type-list-meta mt-0.5 truncate tabular-nums">{row.matricule}</p>
        ) : null}
      </div>

      <div
        className="flex shrink-0 gap-0.5 sm:gap-1"
        role="group"
        aria-label={`Présence — ${name}`}
      >
        {STATUS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = row.status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              aria-label={opt.label}
              title={opt.label}
              onClick={() => onSetStatus(row.student_id, opt.value)}
              className={cn(
                'inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border px-0 transition-colors',
                'sm:min-h-8 sm:min-w-0 sm:px-2',
                'md:px-2.5',
                'lg:px-3',
                active
                  ? opt.activeClass
                  : 'border-wa-divider bg-wa-bg text-wa-text-secondary hover:bg-wa-row-hover',
              )}
            >
              <Icon className="size-4 shrink-0 sm:hidden" aria-hidden />
              <span className="hidden text-xs font-medium sm:inline lg:hidden">{opt.shortLabel}</span>
              <span className="hidden text-sm font-medium lg:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </li>
  );
}
