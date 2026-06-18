'use client';

import { useMemo } from 'react';
import type { StaffRole } from '@/lib/auth/types';
import { WaShellMain } from '@/components/school/mobile/wa-shell-main';
import { getAppWaShellConfig } from '@/lib/navigation/app-nav';
import { WaShellProvider } from '@/lib/navigation/wa-shell-context';

type Props = {
  role: StaffRole;
  children: React.ReactNode;
};

/** Shell WhatsApp Business pour le personnel (même design que la direction). */
export function StaffShellMain({ role, children }: Props) {
  const config = useMemo(() => getAppWaShellConfig(role), [role]);

  return (
    <WaShellProvider config={config}>
      <WaShellMain>{children}</WaShellMain>
    </WaShellProvider>
  );
}
