import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  classDisplayLabel,
  formatStudentGender,
  formatStudentStatus,
  studentFullName,
} from '@/lib/school/students/constants';
import type { StudentDirectoryRow } from '@/lib/db/students';
import { SCHOOL_CYCLE_LABELS, type SchoolCycle } from '@/lib/school/referentials/constants';

type Props = {
  rows: StudentDirectoryRow[];
};

export function StudentsTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Aucun élève ne correspond à votre recherche.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Matricule</th>
            <th className="px-3 py-2 font-medium">Élève</th>
            <th className="px-3 py-2 font-medium">Classe</th>
            <th className="px-3 py-2 font-medium">Sexe</th>
            <th className="px-3 py-2 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30">
              <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                {row.matricule ?? '—'}
              </td>
              <td className="px-3 py-2.5">
                <Link
                  href={`/school/eleves/${row.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {studentFullName(row.last_name, row.first_name)}
                </Link>
              </td>
              <td className="px-3 py-2.5">
                {row.class_id ? (
                  <span>
                    {classDisplayLabel(row.class_level, row.class_name)}
                    {row.class_cycle ? (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (
                        {SCHOOL_CYCLE_LABELS[row.class_cycle as SchoolCycle] ??
                          row.class_cycle}
                        )
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <Badge variant="outline" className="font-normal">
                    Sans classe
                  </Badge>
                )}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {formatStudentGender(row.gender)}
              </td>
              <td className="px-3 py-2.5">
                <Badge
                  variant={row.status === 'active' ? 'secondary' : 'outline'}
                  className="font-normal"
                >
                  {formatStudentStatus(row.status)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
