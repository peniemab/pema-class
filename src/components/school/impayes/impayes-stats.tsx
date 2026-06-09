import Link from 'next/link';
import type { ImpayesStats } from '@/lib/db/impayes-page';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import { cn } from '@/lib/utils';

type Props = {
  stats: ImpayesStats;
};

function feeRecouvrementHref(feeId: string): string {
  return `/school/impayes/recouvrement?frais=${feeId}`;
}

export function ImpayesStatsCards({ stats }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums text-destructive">
            {stats.studentsWithDebt}
          </p>
          <p className="text-xs text-muted-foreground">Élèves avec impayé</p>
        </div>
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums">
            {formatFeeAmount(stats.totalUnpaidCdf, 'CDF')}
          </p>
          <p className="text-xs text-muted-foreground">Total impayé CDF</p>
        </div>
        {stats.totalUnpaidUsd > 0 ? (
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <p className="text-2xl font-semibold tabular-nums">
              {formatFeeAmount(stats.totalUnpaidUsd, 'USD')}
            </p>
            <p className="text-xs text-muted-foreground">Total impayé USD</p>
          </div>
        ) : null}
        <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {stats.studentsUpToDate}
          </p>
          <p className="text-xs text-muted-foreground">
            À jour sur {stats.enrolledCount} inscrit
            {stats.enrolledCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {(stats.feeBreakdown ?? []).length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Répartition par frais
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(stats.feeBreakdown ?? []).map((fee) => {
              const isFullyCollected =
                fee.total_expected > 0 &&
                fee.total_collected >= fee.total_expected - 0.001;
              const hasDebt = fee.total_remaining > 0.001;

              const cardClassName = cn(
                'block rounded-lg border px-4 py-3 transition-colors',
                'hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                hasDebt
                  ? 'bg-muted/20'
                  : isFullyCollected
                    ? 'border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : 'border-dashed bg-muted/5 opacity-60',
              );

              return (
                <Link
                  key={fee.fee_id}
                  href={feeRecouvrementHref(fee.fee_id)}
                  className={cardClassName}
                >
                  <p className="truncate text-sm font-medium">{fee.fee_name}</p>
                  {fee.is_scolarite_pool ? (
                    <p className="text-[11px] text-muted-foreground">
                      Paiements annuels répartis sur les tranches
                    </p>
                  ) : null}
                  <p
                    className={cn(
                      'mt-1 text-lg font-semibold tabular-nums',
                      hasDebt
                        ? 'text-foreground'
                        : isFullyCollected
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-muted-foreground',
                    )}
                  >
                    <span className="text-secondary">
                      {formatFeeAmount(fee.total_collected, fee.currency)}
                    </span>
                    <span className="mx-1 font-normal text-muted-foreground">/</span>
                    <span>
                      {formatFeeAmount(fee.total_expected, fee.currency)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Encaissé / attendu
                    {hasDebt ? (
                      <>
                        {' · '}
                        {fee.student_count} impayé{fee.student_count > 1 ? 's' : ''}
                      </>
                    ) : isFullyCollected ? (
                      <> · Soldé</>
                    ) : (
                      <> · Aucun encaissement</>
                    )}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
