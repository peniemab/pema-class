'use client';

import { useEffect } from 'react';

/** Bump when le SW auth-cache change : force la désinstallation de l'ancien SW sur les PWA installées. */
const SW_RESET_VERSION = 'auth-cache-v2';

export function ServiceWorkerMigration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (localStorage.getItem('pema-sw-version') === SW_RESET_VERSION) return;

    void navigator.serviceWorker.getRegistrations().then(async (regs) => {
      if (regs.length === 0) {
        localStorage.setItem('pema-sw-version', SW_RESET_VERSION);
        return;
      }
      await Promise.all(regs.map((r) => r.unregister()));
      localStorage.setItem('pema-sw-version', SW_RESET_VERSION);
      window.location.reload();
    });
  }, []);

  return null;
}
