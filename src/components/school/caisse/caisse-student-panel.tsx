'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Receipt } from 'lucide-react';
import { recordPaymentAction } from '@/lib/school/payments-actions';
import type {
  PaymentHistoryRow,
  StudentFeeBalance,
} from '@/lib/db/payments';
import type { PaymentReceiptDocument } from '@/lib/documents/types';
import {
  FEE_ANNUAL_LUMP_LABEL,
  formatFeeAmount,
  isScolariteFeeName,
} from '@/lib/school/referentials/constants';
import type { ScolaritePoolSummary } from '@/lib/school/scolarite-balances';
import { ReceiptPrintButton } from '@/components/documents/receipt-print-button';
import { loadPaymentReceiptDocument } from '@/lib/school/print-actions';
import { useSchoolRefresh } from '@/hooks/use-school-refresh';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Props = {
  studentId: string;
  activeYearName: string;
  balances: StudentFeeBalance[];
  payments: PaymentHistoryRow[];
  scolariteSummary?: ScolaritePoolSummary | null;
  caisseBasePath: '/school/caisse' | '/app/caisse';
};

type LastReceipt = {
  paymentId: string;
  receiptNumber: string;
  amountLabel: string;
  remainingLabel: string | null;
  feeName: string;
  document?: PaymentReceiptDocument | null;
};

function defaultAmountForFee(fee: StudentFeeBalance): string {
  const remaining = fee.amount_remaining;
  if (fee.currency === 'USD') {
    return remaining % 1 === 0 ? String(remaining) : remaining.toFixed(2);
  }
  return String(Math.round(remaining));
}

export function CaisseStudentPanel({
  studentId,
  activeYearName,
  balances,
  payments,
  scolariteSummary = null,
  caisseBasePath,
}: Props) {
  const { refresh } = useSchoolRefresh();
  const [pendingFeeId, setPendingFeeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<LastReceipt | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const { unpaid, paid, fixedUnpaid, scolariteUnpaid } = useMemo(() => {
    const unpaidList = balances.filter((b) => !b.is_paid);
    return {
      unpaid: unpaidList,
      paid: balances.filter((b) => b.is_paid),
      fixedUnpaid: unpaidList.filter((b) => !isScolariteFeeName(b.fee_name)),
      scolariteUnpaid: unpaidList.filter((b) => isScolariteFeeName(b.fee_name)),
    };
  }, [balances]);

  const annualLumpPay = useMemo(() => {
    if (
      !scolariteSummary?.has_annual_lump_fee ||
      scolariteSummary.tranche_fee_ids.length === 0 ||
      scolariteSummary.total_remaining <= 0.001 ||
      !scolariteSummary.annual_fee_id
    ) {
      return null;
    }
    return {
      fee_id: scolariteSummary.annual_fee_id,
      fee_name: FEE_ANNUAL_LUMP_LABEL,
      amount_due: scolariteSummary.total_due,
      amount_paid: scolariteSummary.total_paid,
      amount_remaining: scolariteSummary.total_remaining,
      currency: scolariteSummary.currency,
      is_paid: false,
    } satisfies StudentFeeBalance;
  }, [scolariteSummary]);

  const payableFees = useMemo(
    () => [
      ...fixedUnpaid,
      ...scolariteUnpaid,
      ...(annualLumpPay ? [annualLumpPay] : []),
    ],
    [fixedUnpaid, scolariteUnpaid, annualLumpPay],
  );

  const unpaidSignature = useMemo(
    () =>
      payableFees
        .map((f) => `${f.fee_id}:${f.amount_remaining}:${f.amount_paid}`)
        .join('|'),
    [payableFees],
  );

  useEffect(() => {
    setAmounts(() => {
      const next: Record<string, string> = {};
      for (const fee of payableFees) {
        next[fee.fee_id] = defaultAmountForFee(fee);
      }
      return next;
    });
  }, [unpaidSignature]);

  function parseAmount(raw: string, currency: string): number | null {
    const normalized = raw.trim().replace(',', '.');
    const value = Number.parseFloat(normalized);
    if (!Number.isFinite(value)) return null;
    if (currency !== 'USD') return Math.round(value);
    return Math.round(value * 100) / 100;
  }

  async function handlePay(fee: StudentFeeBalance) {
    setError(null);
    setLastReceipt(null);

    const amount = parseAmount(amounts[fee.fee_id] ?? '', fee.currency);
    if (amount == null || amount <= 0) {
      setError('Saisissez un montant valide supérieur à zéro.');
      return;
    }
    if (amount > fee.amount_remaining + 0.001) {
      setError(
        `Le montant ne peut pas dépasser ${formatFeeAmount(fee.amount_remaining, fee.currency)}.`,
      );
      return;
    }

    setPendingFeeId(fee.fee_id);
    const result = await recordPaymentAction({
      studentId,
      feeId: fee.fee_id,
      amount,
      caisseBasePath,
    });
    setPendingFeeId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const amountLabel =
      result.amountPaid != null && result.currency
        ? formatFeeAmount(result.amountPaid, result.currency)
        : '';
    const remainingAfter =
      result.amountPaid != null && result.currency
        ? Math.max(0, fee.amount_remaining - result.amountPaid)
        : 0;
    const remainingLabel =
      remainingAfter > 0.001 && result.currency
        ? formatFeeAmount(remainingAfter, result.currency)
        : null;
    if (result.paymentId && result.receiptNumber) {
      const receiptDoc = await loadPaymentReceiptDocument(result.paymentId);
      setLastReceipt({
        paymentId: result.paymentId,
        receiptNumber: result.receiptNumber,
        amountLabel,
        remainingLabel,
        feeName: result.feeName ?? '',
        document: receiptDoc,
      });
    }
    refresh();
  }

  function renderFeeRowActions(fee: StudentFeeBalance) {
    return (
      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <Input
          id={`amount-${fee.fee_id}`}
          type="text"
          inputMode="decimal"
          value={amounts[fee.fee_id] ?? ''}
          onChange={(e) =>
            setAmounts((prev) => ({
              ...prev,
              [fee.fee_id]: e.target.value,
            }))
          }
          className="h-8 w-full tabular-nums sm:w-24"
          disabled={pendingFeeId !== null}
          aria-label={`Montant pour ${fee.fee_name}`}
          placeholder={formatFeeAmount(fee.amount_remaining, fee.currency)}
        />
        <Button
          type="button"
          size="sm"
          className="h-8 shrink-0 px-3"
          disabled={pendingFeeId !== null}
          onClick={() => handlePay(fee)}
        >
          {pendingFeeId === fee.fee_id ? '…' : 'Encaisser'}
        </Button>
      </div>
    );
  }

  function renderFeeRow(fee: StudentFeeBalance) {
    return (
      <li
        key={fee.fee_id}
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-3 py-2 first:border-t-0 sm:flex-nowrap"
      >
        <div className="min-w-0 flex-1 basis-full sm:basis-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium leading-tight">{fee.fee_name}</p>
            {fee.amount_paid > 0 ? (
              <Badge
                variant="outline"
                className="h-5 shrink-0 px-1.5 text-[10px] font-normal"
              >
                Partiel
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            Dû {formatFeeAmount(fee.amount_due, fee.currency)}
            {fee.amount_paid > 0
              ? ` · Payé ${formatFeeAmount(fee.amount_paid, fee.currency)}`
              : ''}
            {' · '}
            <span className="font-medium text-destructive">
              Reste {formatFeeAmount(fee.amount_remaining, fee.currency)}
            </span>
          </p>
        </div>
        {renderFeeRowActions(fee)}
      </li>
    );
  }

  if (balances.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Aucun frais configuré pour {activeYearName}. Ajoutez des frais dans les{' '}
          <a href="/school/parametres#referentiels" className="font-medium text-primary underline">
            référentiels
          </a>
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {lastReceipt ? (
        <Alert className="border-secondary/30 bg-secondary/5">
          <AlertDescription>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">Paiement enregistré</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {lastReceipt.feeName} — {lastReceipt.amountLabel}
                    {lastReceipt.remainingLabel ? (
                      <span className="block">
                        Reste à payer : {lastReceipt.remainingLabel}
                      </span>
                    ) : (
                      <span className="block text-secondary">Frais soldé</span>
                    )}
                    <span className="mt-1 block font-mono text-xs">
                      {lastReceipt.receiptNumber}
                    </span>
                  </p>
                </div>
              </div>
              <ReceiptPrintButton
                paymentId={lastReceipt.paymentId}
                preloaded={lastReceipt.document}
              />
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Frais — {activeYearName}</CardTitle>
          <CardDescription className="text-xs">
            Montant reçu — paiement partiel ou total.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {payableFees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tous les frais sont soldés pour cette année.
            </p>
          ) : (
            <>
              {fixedUnpaid.length > 0 ? (
                <ul className="overflow-hidden rounded-lg border text-sm">
                  {fixedUnpaid.map((fee) => renderFeeRow(fee))}
                </ul>
              ) : null}

              {scolariteUnpaid.length > 0 || annualLumpPay ? (
                <div className="space-y-2">
                  {scolariteSummary && scolariteSummary.tranche_fee_ids.length > 0 ? (
                    <div className="rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Scolarité — </span>
                      {formatFeeAmount(scolariteSummary.total_paid, scolariteSummary.currency)}
                      {' / '}
                      {formatFeeAmount(scolariteSummary.total_due, scolariteSummary.currency)}
                      {' · '}
                      <span className="font-medium text-destructive">
                        reste{' '}
                        {formatFeeAmount(
                          scolariteSummary.total_remaining,
                          scolariteSummary.currency,
                        )}
                      </span>
                    </div>
                  ) : null}
                  <ul className="overflow-hidden rounded-lg border text-sm">
                    {scolariteUnpaid.map((fee) => renderFeeRow(fee))}
                    {annualLumpPay ? (
                      <li
                        key={annualLumpPay.fee_id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dashed border-primary/30 bg-primary/5 px-3 py-2 sm:flex-nowrap"
                      >
                        <div className="min-w-0 flex-1 basis-full sm:basis-0">
                          <p className="truncate font-medium leading-tight">
                            {annualLumpPay.fee_name}
                          </p>
                          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                            Paiement annuel ou solde restant sur l&apos;année
                            {' · '}
                            <span className="font-medium text-destructive">
                              Reste{' '}
                              {formatFeeAmount(
                                annualLumpPay.amount_remaining,
                                annualLumpPay.currency,
                              )}
                            </span>
                          </p>
                        </div>
                        {renderFeeRowActions(annualLumpPay)}
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
            </>
          )}

          {paid.length > 0 ? (
            <div className="border-t pt-3">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Soldés
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {paid.map((fee) => (
                  <li key={fee.fee_id}>
                    <Badge variant="secondary" className="font-normal text-xs">
                      {fee.fee_name} · {formatFeeAmount(fee.amount_due, fee.currency)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {payments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4" aria-hidden />
              Historique des paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Frais</th>
                    <th className="px-3 py-2 font-medium">Montant</th>
                    <th className="px-3 py-2 font-medium">Reçu</th>
                    <th className="px-3 py-2 font-medium no-print" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {new Date(p.created_at).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-3 py-2.5">{p.fee_name}</td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatFeeAmount(p.amount_paid, p.currency)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                        {p.receipt_number}
                      </td>
                      <td className="px-3 py-2.5">
                        <ReceiptPrintButton
                          paymentId={p.id}
                          label="Imprimer"
                          variant="outline"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
