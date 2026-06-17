'use client';

import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { brand } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PwaInstallButtonProps = {
  variant?: 'default' | 'banner' | 'inline';
  className?: string;
};

export function PwaInstallButton({ variant = 'default', className }: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

  if (installed || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    } else {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex flex-col items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Smartphone className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-foreground">Installer {brand.name}</p>
            <p className="text-sm text-muted-foreground">
              Comme Schoolap : accès rapide depuis l&apos;écran d&apos;accueil, plein écran.
            </p>
          </div>
        </div>
        {deferredPrompt ? (
          <Button type="button" onClick={handleInstall} className="w-full sm:w-auto">
            <Download className="size-4" aria-hidden />
            Installer l&apos;app
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground sm:max-w-xs sm:text-right">
            Sur Chrome / Edge : menu ⋮ → « Ajouter à l&apos;écran d&apos;accueil »
          </p>
        )}
      </div>
    );
  }

  if (!deferredPrompt) {
    if (variant === 'inline') return null;
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        Menu du navigateur → « Ajouter à l&apos;écran d&apos;accueil » pour installer{' '}
        {brand.name}.
      </p>
    );
  }

  return (
    <Button type="button" onClick={handleInstall} className={cn('gap-2', className)}>
      <Download className="size-4" aria-hidden />
      Installer {brand.name}
    </Button>
  );
}
