'use client';

import { Printer, X } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button-link';
import { Button } from '@/components/ui/button';

type Props = {
  backHref: string;
  title?: string;
};

export function PrintToolbar({ backHref, title = 'Document' }: Props) {
  return (
    <div className="no-print sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            Imprimer
          </Button>
          <ButtonLink variant="outline" size="sm" href={backHref} className="gap-1.5">
            <X className="size-4" aria-hidden />
            Fermer
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
