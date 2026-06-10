import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button-link';
import type { UnpaidStudentRow } from '@/lib/db/impayes-page';
import {
  formatStudentRemaining,
  type FeeCurrency,
} from '@/lib/school/fee-currencies';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';

type Props = {
  rows: UnpaidStudentRow[];
  feeCurrencies: FeeCurrency[];
};

export function ImpayesTable({ rows = [], feeCurrencies }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Aucun élève ne correspond à vos filtres.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Élève</th>
            <th className="px-3 py-2 font-medium">Classe</th>
            <th className="px-3 py-2 font-medium">Postes</th>
            <th className="px-3 py-2 font-medium text-right">Reste dû</th>
            <th className="px-3 py-2 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.student_id} className="hover:bg-muted/30">
              <td className="px-3 py-2.5">
                <Link
                  href={`/school/eleves/${row.student_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {studentFullName(row.last_name, row.first_name)}
                </Link>
                {row.matricule ? (
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                    {row.matricule}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {row.class_level && row.class_name
                  ? classDisplayLabel(row.class_level, row.class_name)
                  : '—'}
              </td>
              <td className="px-3 py-2.5">
                <Badge variant="outline" className="font-normal">
                  {row.unpaid_fee_count} frais
                </Badge>
              </td>
              <td className="px-3 py-2.5 text-right font-medium tabular-nums text-destructive">
                {formatStudentRemaining(row, feeCurrencies)}
              </td>
              <td className="px-3 py-2.5 text-right">
                <ButtonLink
                  href={`/school/caisse/${row.student_id}`}
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  Encaisser
                  <ArrowRight className="size-3.5" aria-hidden />
                </ButtonLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
