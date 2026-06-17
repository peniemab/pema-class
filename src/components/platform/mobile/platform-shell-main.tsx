'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { shouldShowPlatformBottomNav } from '@/lib/navigation/platform-nav';
import { PlatformBottomNav } from '@/components/platform/mobile/platform-bottom-nav';
import { PlatformHeader } from '@/components/platform/mobile/platform-header';
import { PlatformSideRail } from '@/components/platform/mobile/platform-side-rail';

type Props = {
  children: React.ReactNode;
};

export function PlatformShellMain({ children }: Props) {
  const pathname = usePathname();
  const showBottomNav = shouldShowPlatformBottomNav(pathname);

  return (
    <div className="flex min-h-dvh min-w-0 flex-1 bg-wa-bg md:h-dvh md:overflow-hidden">
      <PlatformSideRail />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:overflow-hidden">
        <PlatformHeader />
        <main
          className={cn(
            'mx-auto w-full max-w-6xl flex-1 overflow-x-hidden md:min-h-0 md:overflow-y-auto',
            showBottomNav &&
              'pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:pb-0',
          )}
        >
          {children}
        </main>
        {showBottomNav ? <PlatformBottomNav /> : null}
      </div>
    </div>
  );
}

