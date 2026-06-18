'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { useWaShell } from '@/lib/navigation/wa-shell-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  title?: string;
  backHref?: string;
  actions?: React.ReactNode;
  showPrint?: boolean;
};

export function SchoolHeader({ title, backHref, actions, showPrint }: Props) {
  const pathname = usePathname();
  const { getPageMeta, shouldShowBottomNav } = useWaShell();
  const meta = getPageMeta(pathname);
  const showBack = !shouldShowBottomNav(pathname);
  const displayTitle = title ?? meta.title;
  const back = backHref ?? meta.backHref;
  const isReportDetail =
    pathname.startsWith('/school/rapports/') &&
    pathname !== '/school/rapports';

  return (
    <header className="no-print sticky top-0 z-40 shrink-0 bg-wa-header text-wa-header-foreground safe-top md:static">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-2 md:px-4">
        {showBack && back ? (
          <Link
            href={back}
            className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
        ) : (
          <span className="size-10 shrink-0 md:hidden" aria-hidden />
        )}

        <h1 className="min-w-0 flex-1 truncate text-lg font-medium">
          {displayTitle}
        </h1>

        <div className="flex shrink-0 items-center gap-0.5">
          {actions}
          {showPrint || isReportDetail ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 text-wa-header-foreground hover:bg-white/10 hover:text-white"
              onClick={() => window.print()}
              aria-label="Imprimer"
            >
              <Printer className="size-5" aria-hidden />
            </Button>
          ) : (
            <span className="hidden size-10 md:block" aria-hidden />
          )}
        </div>
      </div>
    </header>
  );
}

/** Titre de page redondant avec le header shell — toujours masqué. */
export function WaPageTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('hidden', className)}>{children}</div>;
}

/** @deprecated Utiliser WaPageTitle */
export const MobilePageTitle = WaPageTitle;

/** @deprecated Utiliser SchoolHeader */
export const SchoolMobileHeader = SchoolHeader;
