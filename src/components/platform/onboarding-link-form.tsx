'use client';

import { useState, useTransition } from 'react';
import { generateOnboardingLink } from '@/lib/platform/actions';
import { formatDateTime } from '@/lib/platform/format';
import { CopyLinkButton } from '@/components/platform/copy-link-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function OnboardingLinkForm() {
  const [pending, startTransition] = useTransition();
  const [schoolName, setSchoolName] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof generateOnboardingLink>> | null
  >(null);

  return (
    <div className="rounded-2xl border border-wa-divider bg-wa-panel p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-wa-text-primary">Générer un lien</p>
        <p className="mt-1 text-sm text-wa-text-secondary">
          Lien valable 72h. L&apos;école et le compte directeur sont créés lorsque le lien est utilisé.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="school-name">Nom de l&apos;établissement</Label>
          <Input
            id="school-name"
            type="text"
            placeholder="École Bondeko"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="internal-note">Note interne (optionnel)</Label>
          <textarea
            id="internal-note"
            placeholder="Contexte, contact, commune…"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            rows={3}
            className={cn(
              'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-xl border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setResult(
                await generateOnboardingLink({
                  schoolName,
                  internalNote: internalNote || undefined,
                }),
              );
            })
          }
        >
          {pending ? 'Génération…' : 'Générer le lien'}
        </Button>
        {result?.ok === false && (
          <p className="text-sm text-destructive">{result.error}</p>
        )}
        {result?.ok === true && (
          <div className="rounded-xl border border-wa-divider bg-wa-bg p-4 text-sm">
            <p className="font-medium text-wa-text-primary">Lien à transmettre</p>
            <p className="mt-1 break-all font-mono text-xs text-wa-text-secondary">
              {result.onboardingUrl}
            </p>
            <p className="mt-2 text-wa-text-secondary">
              Expire le {formatDateTime(result.expiresAt)}
            </p>
            <p className="mt-2 text-xs text-wa-text-secondary">
              Ce lien reste recopiable depuis{' '}
              <span className="font-medium">Liens onboarding</span>.
            </p>
            <div className="mt-3">
              <CopyLinkButton url={result.onboardingUrl} variant="secondary" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
