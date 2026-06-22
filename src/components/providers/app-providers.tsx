'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { SerwistProviderWrapper } from '@/components/providers/serwist-provider';
import { ServiceWorkerMigration } from '@/components/providers/sw-migration';
import { SessionKeepAlive } from '@/components/auth/session-keep-alive';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SessionKeepAlive />
      <ServiceWorkerMigration />
      <SerwistProviderWrapper>{children}</SerwistProviderWrapper>
    </TooltipProvider>
  );
}
