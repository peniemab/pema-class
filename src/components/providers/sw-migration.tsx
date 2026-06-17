'use client';

import { useEffect } from 'react';

/** Bump à chaque changement majeur de stratégie SW (une seule migration par appareil). */
const SW_STRATEGY_VERSION = 'pema-sw-v4-assets-only';

/**
 * Remplace l'ancien SW (cache auth cassé) par la stratégie assets-only, une fois.
 */
export function ServiceWorkerMigration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (localStorage.getItem('pema-sw-version') === SW_STRATEGY_VERSION) return;

    void navigator.serviceWorker.getRegistrations().then(async (regs) => {
      if (regs.length > 0) {
        await Promise.all(regs.map((r) => r.unregister()));
      }
      localStorage.setItem('pema-sw-version', SW_STRATEGY_VERSION);
      if (regs.length > 0) {
        window.location.reload();
      }
    });
  }, []);

  return null;
}
