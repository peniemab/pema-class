'use client';

import { useEffect } from 'react';

/**
 * Désinstalle les SW obsolètes qui provoquaient des faux logout en prod.
 * Tant que NEXT_PUBLIC_SERWIST_ENABLE !== 'true', aucun SW ne doit rester actif.
 */
export function ServiceWorkerMigration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const serwistEnabled = process.env.NEXT_PUBLIC_SERWIST_ENABLE === 'true';

    void navigator.serviceWorker.getRegistrations().then(async (regs) => {
      if (regs.length === 0) return;

      if (!serwistEnabled) {
        await Promise.all(regs.map((r) => r.unregister()));
        window.location.reload();
        return;
      }

      const version = 'auth-cache-v3';
      if (localStorage.getItem('pema-sw-version') === version) return;

      await Promise.all(regs.map((r) => r.unregister()));
      localStorage.setItem('pema-sw-version', version);
      window.location.reload();
    });
  }, []);

  return null;
}
