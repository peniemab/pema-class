'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaDownloadLink() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      setUnsupported(true);
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }

  if (installed) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground">
      Pour une meilleure expérience,{' '}
      <button
        type="button"
        onClick={handleInstall}
        className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
      >
        <Download className="size-3.5 shrink-0" aria-hidden />
        téléchargez l&apos;application
      </button>
      {unsupported && !deferredPrompt && (
        <span className="mt-1 block text-xs">
          Utilisez le menu du navigateur (« Ajouter à l&apos;écran d&apos;accueil »).
        </span>
      )}
    </p>
  );
}
