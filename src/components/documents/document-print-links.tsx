import { FileText, Printer } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button-link';

export function EnrollmentPrintLink({
  studentId,
  backHref,
  autoPrint = false,
}: {
  studentId: string;
  backHref: string;
  autoPrint?: boolean;
}) {
  const params = new URLSearchParams({ back: backHref });
  if (autoPrint) params.set('auto', '1');

  return (
    <ButtonLink
      href={`/print/inscription/${studentId}?${params.toString()}`}
      variant="outline"
      size="sm"
      className="gap-1.5"
      target="_blank"
      rel="noopener noreferrer"
    >
      <FileText className="size-4" aria-hidden />
      Imprimer fiche d&apos;inscription
    </ButtonLink>
  );
}

export function ReceiptPrintLink({
  paymentId,
  backHref,
  autoPrint = false,
  label = 'Imprimer le reçu',
  variant = 'default' as 'default' | 'outline',
}: {
  paymentId: string;
  backHref: string;
  autoPrint?: boolean;
  label?: string;
  variant?: 'default' | 'outline';
}) {
  const params = new URLSearchParams({ back: backHref });
  if (autoPrint) params.set('auto', '1');

  return (
    <ButtonLink
      href={`/print/recu/${paymentId}?${params.toString()}`}
      variant={variant}
      size="sm"
      className="gap-1.5"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Printer className="size-4" aria-hidden />
      {label}
    </ButtonLink>
  );
}
