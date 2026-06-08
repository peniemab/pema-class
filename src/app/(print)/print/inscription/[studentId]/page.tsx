import { notFound } from 'next/navigation';
import { loadEnrollmentFicheDocument } from '@/lib/school/print-actions';
import { AutoPrint } from '@/components/documents/auto-print';
import { EnrollmentFicheDocumentView } from '@/components/documents/enrollment-fiche-document';
import { PrintToolbar } from '@/components/documents/print-toolbar';

type Props = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ auto?: string; back?: string }>;
};

export default async function PrintEnrollmentPage({
  params,
  searchParams,
}: Props) {
  const { studentId } = await params;
  const { auto, back } = await searchParams;
  const data = await loadEnrollmentFicheDocument(studentId);
  if (!data) notFound();

  const backHref = back
    ? decodeURIComponent(back)
    : `/school/eleves/${studentId}`;

  return (
    <>
      <PrintToolbar backHref={backHref} title="Fiche d'inscription" />
      <AutoPrint enabled={auto === '1'} />
      <main className="document-page mx-auto max-w-[210mm] bg-white px-6 py-8 shadow-sm print:mx-0 print:max-w-none print:px-0 print:py-0 print:shadow-none sm:my-6 sm:rounded-lg">
        <EnrollmentFicheDocumentView data={data} />
      </main>
    </>
  );
}
