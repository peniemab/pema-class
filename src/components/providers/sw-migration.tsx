'use client';

import { useEffect } from 'react';

const SW_CLEARED_KEY = 'pema-sw-cleared-v1';

/**
 * Désinstalle les SW obsolètes (une seule fois par session) pour éviter faux logout.
 */
export function ServiceWorkerMigration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const serwistEnabled = process.env.NEXT_PUBLIC_SERWIST_ENABLE === 'true';
    if (serwistEnabled) return;

    if (sessionStorage.getItem(SW_CLEARED_KEY) === '1') return;

    void navigator.serviceWorker.getRegistrations().then(async (regs) => {
      sessionStorage.setItem(SW_CLEARED_KEY, '1');
      if (regs.length === 0) return;
      await Promise.all(regs.map((r) => r.unregister()));
      window.location.reload();
    });
  }, []);

  return null;
}
