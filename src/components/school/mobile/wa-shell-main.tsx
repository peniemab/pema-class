'use client';

import { usePathname } from 'next/navigation';
import { SchoolBottomNav } from '@/components/school/mobile/school-bottom-nav';
import { SchoolHeader } from '@/components/school/mobile/school-header';
import { SchoolSideRail } from '@/components/school/mobile/school-side-rail';
import { useWaShell } from '@/lib/navigation/wa-shell-context';
import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
};

/** Corps du shell WhatsApp Business (rail + header + contenu + onglets). */
export function WaShellMain({ children }: Props) {
  const pathname = usePathname();
  const { shouldShowBottomNav } = useWaShell();
  const showBottomNav = shouldShowBottomNav(pathname);

  return (
    <div className="flex min-h-dvh min-w-0 flex-1 bg-wa-bg md:h-dvh md:overflow-hidden">
      <SchoolSideRail />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:overflow-hidden">
        <SchoolHeader />
        <main
          className={cn(
            'mx-auto w-full max-w-6xl flex-1 overflow-x-hidden md:min-h-0 md:overflow-y-auto',
            showBottomNav &&
              'pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:pb-0',
          )}
        >
          {children}
        </main>
        {showBottomNav ? <SchoolBottomNav /> : null}
      </div>
    </div>
  );
}
