'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';

type Props = {
  children: React.ReactNode;
};

/** En dev : pas de SW (évite le cache de chunks webpack obsolètes). Prod : PWA active. */
export function SerwistProviderWrapper({ children }: Props) {
  const disabled = useMemo(() => {
    if (process.env.NODE_ENV === 'development') return true;
    if (process.env.NEXT_PUBLIC_SERWIST_DISABLE === 'true') return true;
    if (process.env.NEXT_PUBLIC_SERWIST_ENABLE !== 'true') return true;
    return false;
  }, []);

  type SerwistProviderComponent = React.ComponentType<{
    children: React.ReactNode;
    swUrl: string;
    register?: boolean;
    reloadOnOnline?: boolean;
  }>;

  const [SerwistProvider, setSerwistProvider] = useState<SerwistProviderComponent | null>(null);

  useEffect(() => {
    if (disabled) return;
    let mounted = true;
    import('@serwist/next/react')
      .then((mod) => {
        if (!mounted) return;
        setSerwistProvider(() => mod.SerwistProvider as SerwistProviderComponent);
      })
      .catch(() => {
        // Si Serwist casse en runtime, on préfère ne pas bloquer l'app.
        setSerwistProvider(null);
      });
    return () => {
      mounted = false;
    };
  }, [disabled]);

  if (disabled || !SerwistProvider) {
    return children;
  }

  return (
    <Suspense fallback={children}>
      <SerwistProvider swUrl="/sw.js" register reloadOnOnline>
        {children}
      </SerwistProvider>
    </Suspense>
  );
}
