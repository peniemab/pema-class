'use client';

import { SerwistProvider } from '@serwist/next/react';

type Props = {
  children: React.ReactNode;
};

/** En dev : pas de SW (évite le cache de chunks webpack obsolètes). Prod : PWA active. */
export function SerwistProviderWrapper({ children }: Props) {
  if (process.env.NODE_ENV === 'development') {
    return children;
  }

  return (
    <SerwistProvider
      swUrl="/sw.js"
      register
      reloadOnOnline
      cacheOnNavigation
    >
      {children}
    </SerwistProvider>
  );
}
