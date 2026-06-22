import type { ImpayesStats, FeeBreakdownStat } from '@/lib/db/impayes-page';
import { WorkspaceLink } from '@/components/school/mobile/workspace-link';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import {
  unpaidTotalLabel,
  type FeeCurrency,
} from '@/lib/school/fee-currencies';
import { cn } from '@/lib/utils';

type Props = {
  stats: ImpayesStats;
  feeCurrencies: FeeCurrency[];
  /** Stack interne : 0 ms, sans recharger l'overlay (T1, T2, inscription, etc.). */
  onFeeSelect?: (feeId: string) => void;
};

function feeRecouvrementHref(feeId: string): string {
  return `/school/impayes/recouvrement?frais=${feeId}`;
}

function FeeCardContent({ fee }: { fee: FeeBreakdownStat }) {
  const isFullyCollected =
    fee.total_expected > 0 &&
    fee.total_collected >= fee.total_expected - 0.001;
  const hasDebt = fee.total_remaining > 0.001;

  return (
    <>
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
        <span>{formatFeeAmount(fee.total_expected, fee.currency)}</span>
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
    </>
  );
}

function feeCardClassName(fee: FeeBreakdownStat): string {
  const isFullyCollected =
    fee.total_expected > 0 &&
    fee.total_collected >= fee.total_expected - 0.001;
  const hasDebt = fee.total_remaining > 0.001;

  return cn(
    'block rounded-lg border px-4 py-3 transition-colors',
    'hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    hasDebt
      ? 'bg-muted/20'
      : isFullyCollected
        ? 'border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
        : 'border-dashed bg-muted/5 opacity-60',
  );
}

export function ImpayesStatsCards({ stats, feeCurrencies, onFeeSelect }: Props) {
  const moneyCards = feeCurrencies.map((currency) => {
    const amount =
      currency === 'USD' ? stats.totalUnpaidUsd : stats.totalUnpaidCdf;
    return (
      <div key={currency} className="rounded-lg border bg-muted/20 px-4 py-3">
        <p className="text-2xl font-semibold tabular-nums">
          {formatFeeAmount(amount, currency)}
        </p>
        <p className="text-xs text-muted-foreground">{unpaidTotalLabel(currency)}</p>
      </div>
    );
  });

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'grid gap-3',
          feeCurrencies.length === 0
            ? 'sm:grid-cols-2 lg:grid-cols-2'
            : feeCurrencies.length === 1
              ? 'sm:grid-cols-2 lg:grid-cols-3'
              : 'sm:grid-cols-2 lg:grid-cols-4',
        )}
      >
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-2xl font-semibold tabular-nums text-destructive">
            {stats.studentsWithDebt}
          </p>
          <p className="text-xs text-muted-foreground">Élèves avec impayé</p>
        </div>
        {moneyCards}
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
              const cardClassName = feeCardClassName(fee);

              if (onFeeSelect) {
                return (
                  <button
                    key={fee.fee_id}
                    type="button"
                    onClick={() => onFeeSelect(fee.fee_id)}
                    className={cn(cardClassName, 'w-full text-left')}
                  >
                    <FeeCardContent fee={fee} />
                  </button>
                );
              }

              return (
                <WorkspaceLink
                  key={fee.fee_id}
                  href={feeRecouvrementHref(fee.fee_id)}
                  className={cardClassName}
                >
                  <FeeCardContent fee={fee} />
                </WorkspaceLink>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
