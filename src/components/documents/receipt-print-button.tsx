'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { loadPaymentReceiptDocument } from '@/lib/school/print-actions';
import { PaymentReceiptDocumentView } from '@/components/documents/payment-receipt-document';
import type { PaymentReceiptDocument } from '@/lib/documents/types';
import { Button } from '@/components/ui/button';

type Props = {
  paymentId: string;
  preloaded?: PaymentReceiptDocument | null;
  label?: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
  className?: string;
};

export function ReceiptPrintButton({
  paymentId,
  preloaded,
  label = 'Imprimer le reçu',
  variant = 'default',
  size = 'sm',
  className,
}: Props) {
  const [receipt, setReceipt] = useState<PaymentReceiptDocument | null>(
    preloaded ?? null,
  );
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const printedRef = useRef(false);

  useEffect(() => {
    if (preloaded) setReceipt(preloaded);
  }, [preloaded]);

  const closeOverlay = useCallback(() => {
    setOpen(false);
    printedRef.current = false;
    document.body.classList.remove('receipt-print-active');
  }, []);

  const openPrint = useCallback((doc: PaymentReceiptDocument) => {
    setReceipt(doc);
    setOpen(true);
    document.body.classList.add('receipt-print-active');
    printedRef.current = false;
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print();
        printedRef.current = true;
      }, 150);
    });
  }, []);

  useEffect(() => {
    function onAfterPrint() {
      if (printedRef.current) closeOverlay();
    }
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, [closeOverlay]);

  function handleClick() {
    if (receipt) {
      openPrint(receipt);
      return;
    }
    startTransition(async () => {
      const doc = await loadPaymentReceiptDocument(paymentId);
      if (doc) openPrint(doc);
    });
  }

  const overlay =
    open && receipt ? (
      <div id="receipt-print-portal" className="receipt-print-portal">
        <div className="no-print receipt-print-portal-toolbar fixed inset-x-0 top-0 z-[100] flex justify-end gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
          <Button type="button" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            Imprimer
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={closeOverlay}>
            Fermer
          </Button>
        </div>
        <main className="document-page mx-auto max-w-[210mm] bg-white px-6 py-8 pt-16">
          <PaymentReceiptDocumentView data={receipt} />
        </main>
      </div>
    ) : null;

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className ?? 'gap-1.5'}
        onClick={handleClick}
        disabled={pending}
      >
        <Printer className="size-4" aria-hidden />
        {pending ? 'Chargement…' : label}
      </Button>
      {typeof document !== 'undefined' && overlay
        ? createPortal(overlay, document.body)
        : null}
    </>
  );
}
