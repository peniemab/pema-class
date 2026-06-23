import { OfflineAppBoot } from '@/components/offline/offline-app-boot';

export const dynamic = 'force-dynamic';

/** Entrée PWA — boot instantané hors ligne (session locale + Dexie). */
export default function BootPage() {
  return <OfflineAppBoot />;
}
