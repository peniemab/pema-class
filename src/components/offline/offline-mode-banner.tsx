'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Bandeau discret quand l'appareil est hors ligne (données locales). */
export function OfflineModeBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="no-print flex items-center justify-center gap-2 bg-amber-600/95 px-3 py-1.5 text-center text-xs font-medium text-white safe-top"
    >
      <WifiOff className="size-3.5 shrink-0" aria-hidden />
      <span>Hors ligne — données locales · sync à la reconnexion</span>
    </div>
  );
}
