'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { SerwistProviderWrapper } from '@/components/providers/serwist-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SerwistProviderWrapper>{children}</SerwistProviderWrapper>
    </TooltipProvider>
  );
}
