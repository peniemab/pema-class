import {
  formatFeeAmount,
  normalizeFeeCurrency,
  type FeeCurrency,
} from '@/lib/school/referentials/constants';

export type { FeeCurrency };

export type DualMoneyAmounts = { cdf: number; usd: number };

export function getSchoolFeeCurrencies(
  fees: { currency: string }[],
): FeeCurrency[] {
  const set = new Set<FeeCurrency>();
  for (const fee of fees) {
    set.add(normalizeFeeCurrency(fee.currency));
  }
  const ordered: FeeCurrency[] = [];
  if (set.has('CDF')) ordered.push('CDF');
  if (set.has('USD')) ordered.push('USD');
  return ordered;
}

export function formatDualMoney(
  amounts: DualMoneyAmounts,
  currencies: FeeCurrency[],
  options?: { skipZero?: boolean; separator?: string },
): string {
  const sep = options?.separator ?? ' · ';
  const skipZero = options?.skipZero ?? true;
  const parts: string[] = [];

  if (currencies.includes('CDF')) {
    if (!skipZero || amounts.cdf > 0.001) {
      parts.push(formatFeeAmount(amounts.cdf, 'CDF'));
    }
  }
  if (currencies.includes('USD')) {
    if (!skipZero || amounts.usd > 0.001) {
      parts.push(formatFeeAmount(amounts.usd, 'USD'));
    }
  }

  if (parts.length === 0 && currencies.length === 1) {
    return formatFeeAmount(0, currencies[0]);
  }

  return parts.length > 0 ? parts.join(sep) : '—';
}

export function formatStudentRemaining(
  row: { remaining_cdf: number; remaining_usd: number },
  currencies: FeeCurrency[],
): string {
  const parts: string[] = [];
  if (currencies.includes('CDF') && row.remaining_cdf > 0.001) {
    parts.push(formatFeeAmount(row.remaining_cdf, 'CDF'));
  }
  if (currencies.includes('USD') && row.remaining_usd > 0.001) {
    parts.push(formatFeeAmount(row.remaining_usd, 'USD'));
  }
  return parts.length > 0 ? parts.join(' + ') : '—';
}

export function unpaidTotalLabel(currency: FeeCurrency): string {
  return currency === 'USD' ? 'Total impayé USD' : 'Total impayé CDF';
}

export function cashTotalLabel(currency: FeeCurrency): string {
  return currency === 'USD' ? 'Total USD' : 'Total CDF';
}
