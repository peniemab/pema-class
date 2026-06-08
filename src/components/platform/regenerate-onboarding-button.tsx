'use client';

import { useState, useTransition } from 'react';
import { Copy, Check } from 'lucide-react';
import { regenerateSchoolOnboardingLink } from '@/lib/platform/actions';
import { formatDateTime } from '@/lib/platform/format';
import { Button } from '@/components/ui/button';

type RegenerateOnboardingButtonProps = {
  schoolId: string;
};

export function RegenerateOnboardingButton({
  schoolId,
}: RegenerateOnboardingButtonProps) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof regenerateSchoolOnboardingLink>> | null
  >(null);

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(await regenerateSchoolOnboardingLink(schoolId));
          })
        }
      >
        {pending ? 'Génération…' : 'Régénérer le lien onboarding'}
      </Button>
      {result?.ok === false && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
      {result?.ok === true && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p className="font-medium">Nouveau lien (7 jours)</p>
          <p className="mt-1 break-all font-mono text-xs">{result.onboardingUrl}</p>
          <p className="mt-2 text-muted-foreground">
            Expire le {formatDateTime(result.expiresAt)}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => copyUrl(result.onboardingUrl)}
          >
            {copied ? (
              <Check data-icon="inline-start" />
            ) : (
              <Copy data-icon="inline-start" />
            )}
            {copied ? 'Copié' : 'Copier'}
          </Button>
        </div>
      )}
    </div>
  );
}
