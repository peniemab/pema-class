import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button-link';
import type { RecouvrementStudentRow } from '@/lib/db/impayes-page';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';
import { cn } from '@/lib/utils';

type Props = {
  rows: RecouvrementStudentRow[];
  feeName: string;
};

export function RecouvrementTable({ rows, feeName }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Aucun élève inscrit pour {feeName} avec ces filtres.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="w-10 px-3 py-2 font-medium tabular-nums">N°</th>
            <th className="px-3 py-2 font-medium">Élève</th>
            <th className="px-3 py-2 font-medium">Matricule</th>
            <th className="px-3 py-2 font-medium">Classe</th>
            <th className="px-3 py-2 font-medium text-right">Reste dû</th>
            <th className="no-print px-3 py-2 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, index) => {
            const isPaid = row.amount_remaining <= 0.001;
            return (
              <tr key={row.student_id} className="hover:bg-muted/30">
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                  {index + 1}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/school/eleves/${row.student_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {studentFullName(row.last_name, row.first_name)}
                  </Link>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                  {row.matricule ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {row.class_level && row.class_name
                    ? classDisplayLabel(row.class_level, row.class_name)
                    : '—'}
                </td>
                <td
                  className={cn(
                    'px-3 py-2.5 text-right font-medium tabular-nums',
                    isPaid
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive',
                  )}
                >
                  {isPaid
                    ? 'Soldé'
                    : formatFeeAmount(row.amount_remaining, row.currency)}
                </td>
                <td className="no-print px-3 py-2.5 text-right">
                  {isPaid ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <ButtonLink
                      href={`/school/caisse/${row.student_id}`}
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      Encaisser
                      <ArrowRight className="size-3.5" aria-hidden />
                    </ButtonLink>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
