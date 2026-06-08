import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  TriangleAlert,
} from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { SchoolRegisterForm } from '@/components/auth/school-register-form';
import { getOnboardingInvitePreview } from '@/lib/db/onboarding';
import { formatDateTime } from '@/lib/platform/format';
import { brand } from '@/lib/brand';

type PageProps = {
  searchParams: Promise<{ invite?: string }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const { invite: inviteParam } = await searchParams;
  const inviteFromUrl = inviteParam?.trim() ?? '';
  const preview = inviteFromUrl
    ? await getOnboardingInvitePreview(inviteFromUrl)
    : null;

  const defaultToken = preview?.rawToken ?? inviteFromUrl;
  const invitationValid = preview?.valid === true;
  const hasInvalidInvite = Boolean(inviteFromUrl && !invitationValid);

  return (
    <main className="min-h-dvh bg-background px-5 py-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Retour
          </Link>
          <BrandMark size="sm" showSubtitle={false} />
        </header>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <div className="mb-8 space-y-3 text-center">
            <div
              className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              aria-hidden
            >
              <GraduationCap className="size-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Créez votre compte
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Créez votre compte professionnel avec votre adresse e-mail.
              </p>
            </div>
          </div>

          {invitationValid && preview?.schoolName && preview.expiresAt ? (
            <div className="mb-6 rounded-2xl border border-secondary/30 bg-secondary/10 p-4 text-sm">
              <div className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-secondary"
                  aria-hidden
                />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    Invitation {brand.name} détectée
                  </p>
                  <p className="text-muted-foreground">
                    Vous êtes invité à créer le compte directeur de{' '}
                    <span className="font-medium text-foreground">
                      {preview.schoolName}
                    </span>
                    .
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ce lien expire le {formatDateTime(preview.expiresAt)}.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {hasInvalidInvite ? (
            <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <div className="flex gap-3">
                <TriangleAlert
                  className="mt-0.5 size-5 shrink-0 text-destructive"
                  aria-hidden
                />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    Lien d&apos;invitation invalide ou expiré
                  </p>
                  <p className="text-muted-foreground">
                    {preview?.reason === 'error'
                      ? 'Impossible de vérifier l’invitation. Appliquez le patch SQL Supabase puis réessayez.'
                      : `Contactez ${brand.name} pour recevoir une nouvelle invitation.`}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <SchoolRegisterForm
            defaultInvitationToken={defaultToken}
            invitationReadonly={invitationValid && Boolean(inviteFromUrl)}
          />
        </section>
      </div>
    </main>
  );
}
