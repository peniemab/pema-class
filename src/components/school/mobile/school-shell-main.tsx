'use client';

import { usePathname } from 'next/navigation';
import { shouldShowSchoolBottomNav } from '@/lib/navigation/school-nav';
import { SchoolBottomNav } from '@/components/school/mobile/school-bottom-nav';
import { SchoolHeader } from '@/components/school/mobile/school-header';
import { SchoolSideRail } from '@/components/school/mobile/school-side-rail';
import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
};

export function SchoolShellMain({ children }: Props) {
  const pathname = usePathname();
  const showBottomNav = shouldShowSchoolBottomNav(pathname);

  return (
    <div className="flex min-h-dvh min-w-0 flex-1 bg-wa-bg">
      <SchoolSideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <SchoolHeader />
        <main
          className={cn(
            'mx-auto w-full max-w-6xl flex-1 overflow-x-hidden',
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
