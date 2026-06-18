import Link from 'next/link';
import { WaAvatar } from '@/components/school/mobile/wa-avatar';
import { WaLabel } from '@/components/school/mobile/wa-label';
import { WaList, WaListRow } from '@/components/school/mobile/wa-list-row';
import {
  classDisplayLabel,
  formatStudentStatus,
  studentFullName,
} from '@/lib/school/students/constants';
import type { StudentDirectoryRow } from '@/lib/db/students';
import { SCHOOL_CYCLE_LABELS, type SchoolCycle } from '@/lib/school/referentials/constants';

type Props = {
  rows: StudentDirectoryRow[];
  /** Si fourni, le clic ouvre un panneau (offline) au lieu de naviguer. */
  onSelect?: (id: string) => void;
};

function classLabel(row: StudentDirectoryRow): string {
  if (!row.class_id) return 'Sans classe';
  const base = classDisplayLabel(row.class_level, row.class_name);
  if (row.class_cycle) {
    const cycle =
      SCHOOL_CYCLE_LABELS[row.class_cycle as SchoolCycle] ?? row.class_cycle;
    return `${base} · ${cycle}`;
  }
  return base;
}

function studentLabels(row: StudentDirectoryRow) {
  const labels: React.ReactNode[] = [];
  if (!row.class_id) {
    labels.push(
      <WaLabel key="unassigned" tone="amber">
        Sans classe
      </WaLabel>,
    );
  }
  if (row.status !== 'active') {
    labels.push(
      <WaLabel key="status" tone="red">
        {formatStudentStatus(row.status)}
      </WaLabel>,
    );
  }
  return labels.length > 0 ? (
    <span className="mt-1 flex flex-wrap gap-1">{labels}</span>
  ) : null;
}

export function StudentsTable({ rows, onSelect }: Props) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-wa-text-secondary">
        Aucun élève ne correspond à votre recherche.
      </p>
    );
  }

  return (
    <WaList>
      {rows.map((row) => {
        const name = studentFullName(row.last_name, row.first_name);
        return (
          <WaListRow
            key={row.id}
            href={onSelect ? undefined : `/school/eleves/${row.id}`}
            onClick={onSelect ? () => onSelect(row.id) : undefined}
            avatar={<WaAvatar name={name} size="md" />}
            title={name}
            subtitle={
              <>
                <span className="block truncate">
                  {row.matricule ?? '—'} · {classLabel(row)}
                </span>
                {studentLabels(row)}
              </>
            }
          />
        );
      })}
    </WaList>
  );
}
