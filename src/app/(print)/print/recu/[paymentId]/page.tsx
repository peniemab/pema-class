import { notFound } from 'next/navigation';
import { loadPaymentReceiptDocument } from '@/lib/school/print-actions';
import { AutoPrint } from '@/components/documents/auto-print';
import { PaymentReceiptDocumentView } from '@/components/documents/payment-receipt-document';
import { PrintToolbar } from '@/components/documents/print-toolbar';

type Props = {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ auto?: string; back?: string }>;
};

export default async function PrintReceiptPage({ params, searchParams }: Props) {
  const { paymentId } = await params;
  const { auto, back } = await searchParams;
  const data = await loadPaymentReceiptDocument(paymentId);
  if (!data) notFound();

  const backHref = back ? decodeURIComponent(back) : '/school/caisse';

  return (
    <>
      <PrintToolbar backHref={backHref} title="Reçu de paiement" />
      <AutoPrint enabled={auto === '1'} />
      <main className="document-page mx-auto max-w-[210mm] bg-white px-6 py-8 shadow-sm print:mx-0 print:max-w-none print:px-0 print:py-0 print:shadow-none sm:my-6 sm:rounded-lg">
        <PaymentReceiptDocumentView data={data} />
      </main>
    </>
  );
}
