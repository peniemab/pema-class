'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  label?: string;
};

export function RecouvrementPrintButton({ label = 'Imprimer la liste' }: Props) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="no-print gap-1.5"
      onClick={() => window.print()}
    >
      <Printer className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
