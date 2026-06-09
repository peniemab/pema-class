import type { StudentFeeBalance } from '@/lib/db/payments';
import {
  FEE_ANNUAL_LUMP_LABEL,
  feeTrancheSortOrder,
  isAnnualScolariteFee,
  isScolariteFeeName,
  isTrancheScolariteFee,
} from '@/lib/school/referentials/constants';

/** Id virtuel pour la card recouvrement quand la ligne « Scolarité annuelle » n'existe pas en base. */
export const SCOLARITE_POOL_VIRTUAL_FEE_ID = '__scolarite_pool__';
export type ScolaritePoolSummary = {
  currency: string;
  total_due: number;
  total_paid: number;
  total_remaining: number;
  /** Fee id used for « paiement annuel » (reçu Scolarité annuelle). */
  annual_fee_id: string | null;
  /** True when « Scolarité annuelle » exists as fee row linked to tranches. */
  has_annual_lump_fee: boolean;
  tranche_fee_ids: string[];
};

export function hasScolariteTranches(
  fees: { name: string }[],
): boolean {
  return fees.some((f) => isTrancheScolariteFee(f.name));
}

export function isScolaritePoolAggregateFee(
  fee: { id: string; name: string },
  fees: { name: string }[],
): boolean {
  if (fee.id === SCOLARITE_POOL_VIRTUAL_FEE_ID) return hasScolariteTranches(fees);
  return isAnnualScolariteFee(fee.name) && hasScolariteTranches(fees);
}

export function studentScolariteRawBalances(
  studentId: string,
  fees: { id: string; name: string; amount: number; currency: string }[],
  paidByStudentFee: Map<string, number>,
): StudentFeeBalance[] {
  const scolariteFees = fees.filter((f) => isScolariteFeeName(f.name));
  const paidByFee = new Map<string, number>();
  for (const fee of scolariteFees) {
    const paid = paidByStudentFee.get(`${studentId}:${fee.id}`) ?? 0;
    if (paid > 0) paidByFee.set(fee.id, paid);
  }
  return buildRawStudentFeeBalances(scolariteFees, paidByFee);
}

export function scolaritePoolSummaryForStudent(
  studentId: string,
  fees: { id: string; name: string; amount: number; currency: string }[],
  paidByStudentFee: Map<string, number>,
): ScolaritePoolSummary | null {
  const raw = studentScolariteRawBalances(studentId, fees, paidByStudentFee);
  if (raw.length === 0) return null;
  const { summary } = allocateScolaritePool(raw);
  return summary;
}

export function scolaritePoolFeeId(
  fees: { id: string; name: string }[],
): string {
  const annual = fees.find((f) => isAnnualScolariteFee(f.name));
  return annual?.id ?? SCOLARITE_POOL_VIRTUAL_FEE_ID;
}

export function splitBalancesByCategory(balances: StudentFeeBalance[]): {
  scolarite: StudentFeeBalance[];
  fixed: StudentFeeBalance[];
} {
  const scolarite: StudentFeeBalance[] = [];
  const fixed: StudentFeeBalance[] = [];
  for (const b of balances) {
    if (isScolariteFeeName(b.fee_name)) scolarite.push(b);
    else fixed.push(b);
  }
  return { scolarite, fixed };
}

function groupByCurrency(
  items: StudentFeeBalance[],
): Map<string, StudentFeeBalance[]> {
  const map = new Map<string, StudentFeeBalance[]>();
  for (const item of items) {
    const list = map.get(item.currency) ?? [];
    list.push(item);
    map.set(item.currency, list);
  }
  return map;
}

export function buildRawStudentFeeBalances(
  fees: { id: string; name: string; amount: number; currency: string }[],
  paidByFee: Map<string, number>,
): StudentFeeBalance[] {
  return fees.map((fee) => {
    const amountPaid = paidByFee.get(fee.id) ?? 0;
    const amountDue = Number(fee.amount);
    const amountRemaining = Math.max(0, amountDue - amountPaid);
    return {
      fee_id: fee.id,
      fee_name: fee.name,
      amount_due: amountDue,
      amount_paid: amountPaid,
      amount_remaining: amountRemaining,
      currency: fee.currency,
      is_paid: amountRemaining <= 0.001,
    };
  });
}

export function allocateScolaritePool(rawItems: StudentFeeBalance[]): {
  displayItems: StudentFeeBalance[];
  summary: ScolaritePoolSummary | null;
} {
  if (rawItems.length === 0) {
    return { displayItems: [], summary: null };
  }

  const currency = rawItems[0].currency;
  const trancheRaw = rawItems
    .filter((b) => isTrancheScolariteFee(b.fee_name))
    .sort(
      (a, b) =>
        feeTrancheSortOrder(a.fee_name) - feeTrancheSortOrder(b.fee_name),
    );
  const annualRaw = rawItems.find((b) => isAnnualScolariteFee(b.fee_name));
  const poolPaid = rawItems.reduce((sum, item) => sum + item.amount_paid, 0);

  if (trancheRaw.length === 0) {
    if (!annualRaw) return { displayItems: [], summary: null };
    return {
      displayItems: [annualRaw],
      summary: {
        currency,
        total_due: annualRaw.amount_due,
        total_paid: annualRaw.amount_paid,
        total_remaining: annualRaw.amount_remaining,
        annual_fee_id: annualRaw.fee_id,
        has_annual_lump_fee: true,
        tranche_fee_ids: [],
      },
    };
  }

  const totalDue = trancheRaw.reduce((sum, t) => sum + t.amount_due, 0);
  let remainingPool = poolPaid;
  const displayItems: StudentFeeBalance[] = [];

  for (const tranche of trancheRaw) {
    const allocatedPaid = Math.min(tranche.amount_due, remainingPool);
    remainingPool -= allocatedPaid;
    const amountRemaining = Math.max(0, tranche.amount_due - allocatedPaid);
    displayItems.push({
      ...tranche,
      amount_paid: allocatedPaid,
      amount_remaining: amountRemaining,
      is_paid: amountRemaining <= 0.001,
    });
  }

  const firstUnpaid = displayItems.find((t) => !t.is_paid);

  return {
    displayItems,
    summary: {
      currency,
      total_due: totalDue,
      total_paid: Math.min(poolPaid, totalDue),
      total_remaining: Math.max(0, totalDue - poolPaid),
      annual_fee_id:
        annualRaw?.fee_id ?? firstUnpaid?.fee_id ?? trancheRaw[0]?.fee_id ?? null,
      has_annual_lump_fee: Boolean(annualRaw),
      tranche_fee_ids: trancheRaw.map((t) => t.fee_id),
    },
  };
}

export function applyScolaritePoolToBalances(
  rawBalances: StudentFeeBalance[],
): {
  balances: StudentFeeBalance[];
  scolariteSummary: ScolaritePoolSummary | null;
} {
  const { scolarite, fixed } = splitBalancesByCategory(rawBalances);
  if (scolarite.length === 0) {
    return { balances: rawBalances, scolariteSummary: null };
  }

  const byCurrency = groupByCurrency(scolarite);
  const displayScolarite: StudentFeeBalance[] = [];
  let scolariteSummary: ScolaritePoolSummary | null = null;

  for (const items of byCurrency.values()) {
    const { displayItems, summary } = allocateScolaritePool(items);
    displayScolarite.push(...displayItems);
    if (summary) scolariteSummary = summary;
  }

  displayScolarite.sort(
    (a, b) =>
      feeTrancheSortOrder(a.fee_name) - feeTrancheSortOrder(b.fee_name) ||
      a.fee_name.localeCompare(b.fee_name, 'fr'),
  );

  return {
    balances: [...fixed, ...displayScolarite],
    scolariteSummary,
  };
}

/** Montant max encaissable sur un poste (pool scolarité ou frais fixe). */
export function getPaymentLimitForFee(
  feeId: string,
  rawBalances: StudentFeeBalance[],
): number {
  const target = rawBalances.find((b) => b.fee_id === feeId);
  if (!target) return 0;

  if (!isScolariteFeeName(target.fee_name)) {
    return target.amount_remaining;
  }

  const { scolarite } = splitBalancesByCategory(rawBalances);
  const items = scolarite.filter((b) => b.currency === target.currency);
  const { displayItems, summary } = allocateScolaritePool(items);

  if (isAnnualScolariteFee(target.fee_name) && summary && summary.tranche_fee_ids.length > 0) {
    return summary.total_remaining;
  }

  const tranche = displayItems.find((b) => b.fee_id === feeId);
  return tranche?.amount_remaining ?? summary?.total_remaining ?? 0;
}

/** Solde scolarité restant pour un élève (une seule fois, pas tranches + annuelle). */
export function scolariteRemainingForStudent(
  rawBalances: StudentFeeBalance[],
): number {
  const { scolarite } = splitBalancesByCategory(rawBalances);
  if (scolarite.length === 0) return 0;

  let total = 0;
  for (const items of groupByCurrency(scolarite).values()) {
    const { summary } = allocateScolaritePool(items);
    if (summary) total += summary.total_remaining;
  }
  return total;
}
