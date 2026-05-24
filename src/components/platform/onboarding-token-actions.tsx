'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { rotateOnboardingTokenAction } from '@/lib/platform/actions';
import { formatDateTime } from '@/lib/platform/format';
import { CopyLinkButton } from '@/components/platform/copy-link-button';
import { Button } from '@/components/ui/button';

type OnboardingTokenActionsProps = {
  tokenId: string;
  onboardingUrl: string | null;
  linkStatus: 'pending' | 'used' | 'expired';
};

export function OnboardingTokenActions({
  tokenId,
  onboardingUrl: initialUrl,
  linkStatus,
}: OnboardingTokenActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(initialUrl);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (linkStatus === 'used') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  function regenerate() {
    setError(null);
    startTransition(async () => {
      const result = await rotateOnboardingTokenAction(tokenId);
      if (result.ok) {
        setUrl(result.onboardingUrl);
        setExpiresAt(result.expiresAt);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (linkStatus === 'expired' || !url) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={regenerate}
        >
          {pending ? 'Génération…' : 'Régénérer le lien'}
        </Button>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
        {url ? (
          <div className="flex flex-col gap-1">
            <CopyLinkButton url={url} />
            {expiresAt ? (
              <span className="text-xs text-muted-foreground">
                Expire le {formatDateTime(expiresAt)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <CopyLinkButton url={url} />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-auto px-0 text-xs text-muted-foreground"
        disabled={pending}
        onClick={regenerate}
      >
        Nouveau lien (invalide l&apos;ancien)
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
