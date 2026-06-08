'use client';

import { useState } from 'react';
import { Check, Receipt } from 'lucide-react';
import { recordPaymentAction } from '@/lib/school/payments-actions';
import type {
  PaymentHistoryRow,
  StudentFeeBalance,
} from '@/lib/db/payments';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import { ReceiptPrintLink } from '@/components/documents/document-print-links';
import { useSchoolRefresh } from '@/hooks/use-school-refresh';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  caisseBasePath: '/school/caisse' | '/app/caisse';
};

type LastReceipt = {
  paymentId: string;
  receiptNumber: string;
  amountLabel: string;
  feeName: string;
};

export function CaisseStudentPanel({
  studentId,
  activeYearName,
  balances,
  payments,
  caisseBasePath,
}: Props) {
  const { refresh } = useSchoolRefresh();
  const backHref = `${caisseBasePath}/${studentId}`;
  const [pendingFeeId, setPendingFeeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<LastReceipt | null>(null);

  const unpaid = balances.filter((b) => !b.is_paid);
  const paid = balances.filter((b) => b.is_paid);

  async function handlePay(feeId: string) {
    setError(null);
    setLastReceipt(null);
    setPendingFeeId(feeId);
    const result = await recordPaymentAction({
      studentId,
      feeId,
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
    if (result.paymentId && result.receiptNumber) {
      setLastReceipt({
        paymentId: result.paymentId,
        receiptNumber: result.receiptNumber,
        amountLabel,
        feeName: result.feeName ?? '',
      });
    }
    refresh();
  }

  if (balances.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Aucun frais configuré pour {activeYearName}. Ajoutez des frais dans les{' '}
          <a href="/school/referentiels" className="font-medium text-primary underline">
            référentiels
          </a>
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
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
                    <span className="mt-1 block font-mono text-xs">
                      {lastReceipt.receiptNumber}
                    </span>
                  </p>
                </div>
              </div>
              <ReceiptPrintLink
                paymentId={lastReceipt.paymentId}
                backHref={backHref}
                autoPrint
              />
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Frais — {activeYearName}</CardTitle>
          <CardDescription>
            Encaissement du solde restant par poste de frais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unpaid.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tous les frais sont soldés pour cette année.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {unpaid.map((fee) => (
                <li
                  key={fee.fee_id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{fee.fee_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Dû {formatFeeAmount(fee.amount_due, fee.currency)}
                      {fee.amount_paid > 0
                        ? ` · Payé ${formatFeeAmount(fee.amount_paid, fee.currency)}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatFeeAmount(fee.amount_remaining, fee.currency)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={pendingFeeId !== null}
                      onClick={() => handlePay(fee.fee_id)}
                    >
                      {pendingFeeId === fee.fee_id ? 'Encaissement…' : 'Encaisser'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {paid.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Soldés
              </p>
              <ul className="flex flex-wrap gap-2">
                {paid.map((fee) => (
                  <li key={fee.fee_id}>
                    <Badge variant="secondary" className="font-normal">
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
                        <ReceiptPrintLink
                          paymentId={p.id}
                          backHref={backHref}
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
