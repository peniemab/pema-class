'use client';

import { WaShellMain } from '@/components/school/mobile/wa-shell-main';
import { SCHOOL_WA_SHELL_CONFIG } from '@/lib/navigation/school-nav';
import { WaShellProvider } from '@/lib/navigation/wa-shell-context';

type Props = {
  children: React.ReactNode;
};

export function SchoolShellMain({ children }: Props) {
  return (
    <WaShellProvider config={SCHOOL_WA_SHELL_CONFIG}>
      <WaShellMain>{children}</WaShellMain>
    </WaShellProvider>
  );
}
