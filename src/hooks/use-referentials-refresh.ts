'use client';

import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/** Rafraîchit la page référentiels sans bloquer l’UI (React transition). */
export function useReferentialsRefresh() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return { refresh, isRefreshing };
}
