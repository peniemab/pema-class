'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import {
  getPlatformMobilePageMeta,
  shouldShowPlatformBottomNav,
} from '@/lib/navigation/platform-nav';
import { ButtonLink } from '@/components/ui/button-link';

type Props = {
  title?: string;
  backHref?: string;
  actions?: React.ReactNode;
};

export function PlatformHeader({ title, backHref, actions }: Props) {
  const pathname = usePathname();
  const meta = getPlatformMobilePageMeta(pathname);
  const showBack = !shouldShowPlatformBottomNav(pathname);
  const displayTitle = title ?? meta.title;
  const back = backHref ?? meta.backHref;

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

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-medium">{displayTitle}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <span className="hidden items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-white/95 md:inline-flex">
            <ShieldCheck className="size-3.5" aria-hidden />
            Superadmin
          </span>
          {actions}
          <ButtonLink
            variant="ghost"
            size="icon"
            className="size-10 text-wa-header-foreground hover:bg-white/10 hover:text-white"
            href="/logout"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut className="size-5" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

