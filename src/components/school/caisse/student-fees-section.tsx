import Link from 'next/link';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import type { StudentFeeBalance } from '@/lib/db/payments';
import { ButtonLink } from '@/components/ui/button-link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Props = {
  studentId: string;
  activeYearName: string | null;
  balances: StudentFeeBalance[];
  caisseBasePath?: '/school/caisse' | '/app/caisse';
};

export function StudentFeesSection({
  studentId,
  activeYearName,
  balances,
  caisseBasePath = '/school/caisse',
}: Props) {
  if (!activeYearName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frais scolaires</CardTitle>
          <CardDescription>Aucune année scolaire active.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const unpaid = balances.filter((b) => !b.is_paid);
  const totalUnpaid = unpaid.reduce((sum, b) => {
    if (b.currency === 'USD') return sum;
    return sum + b.amount_remaining;
  }, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Frais scolaires</CardTitle>
          <CardDescription>Année {activeYearName}</CardDescription>
        </div>
        {unpaid.length > 0 ? (
          <ButtonLink href={`${caisseBasePath}/${studentId}`} size="sm">
            Encaisser
          </ButtonLink>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {balances.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun frais configuré.{' '}
            <Link href="/school/parametres#referentiels" className="text-primary underline">
              Référentiels
            </Link>
          </p>
        ) : unpaid.length === 0 ? (
          <p className="text-sm text-secondary">Tous les frais sont soldés.</p>
        ) : (
          <>
            <ul className="space-y-2 text-sm">
              {unpaid.map((fee) => (
                <li
                  key={fee.fee_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <span>{fee.fee_name}</span>
                  <Badge variant="outline" className="font-normal tabular-nums">
                    {formatFeeAmount(fee.amount_remaining, fee.currency)} restants
                  </Badge>
                </li>
              ))}
            </ul>
            {totalUnpaid > 0 ? (
              <p className="text-xs text-muted-foreground">
                Total impayé CDF (hors USD) : {formatFeeAmount(totalUnpaid, 'CDF')}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
