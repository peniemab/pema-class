'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { SerwistProviderWrapper } from '@/components/providers/serwist-provider';
import { ServiceWorkerMigration } from '@/components/providers/sw-migration';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <ServiceWorkerMigration />
      <SerwistProviderWrapper>{children}</SerwistProviderWrapper>
    </TooltipProvider>
  );
}
