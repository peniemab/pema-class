import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  TriangleAlert,
} from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { StaffJoinForm } from '@/components/auth/staff-join-form';
import {
  peekStaffInvitation,
  extractStaffInviteToken,
} from '@/lib/db/invitations';
import { staffRoleLabel } from '@/lib/auth/types';
import { brand } from '@/lib/brand';

type PageProps = {
  searchParams: Promise<{ invite?: string }>;
};

function invalidInviteMessage(reason?: string): string {
  switch (reason) {
    case 'error':
      return 'Impossible de vérifier l’invitation. Appliquez les migrations Supabase (000001 et 000002) ou contactez le support.';
    case 'wrong_invite_type':
      return 'Ce lien est réservé à la création du compte directeur. Utilisez la page d’inscription établissement (/register).';
    case 'expired':
      return 'Ce lien a expiré. Demandez à la direction un nouveau lien d’invitation (valable 7 jours).';
    case 'invalid_token':
      return 'Le code d’invitation est trop court ou mal formaté. Collez le lien complet reçu par e-mail.';
    case 'not_found':
      return 'Invitation introuvable ou déjà utilisée. Demandez un nouveau lien à la direction.';
    default:
      return 'Contactez la direction de votre établissement pour recevoir une nouvelle invitation.';
  }
}

export default async function JoinPage({ searchParams }: PageProps) {
  const { invite: inviteParam } = await searchParams;
  const inviteFromUrl = inviteParam?.trim() ?? '';
  const token = inviteFromUrl ? extractStaffInviteToken(inviteFromUrl) : '';
  const preview = token ? await peekStaffInvitation(token) : null;

  const invitationValid = preview?.ok === true;
  const hasInvalidInvite = Boolean(inviteFromUrl && !invitationValid);
  const roleLabel = preview?.role ? staffRoleLabel(preview.role) : '';

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
              <Users className="size-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Rejoindre un établissement
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Créez votre compte collaborateur avec le lien transmis par la
                direction. Votre rôle est fixé dans le lien et ne peut pas être
                modifié.
              </p>
            </div>
          </div>

          {invitationValid && preview?.schoolName && roleLabel ? (
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
                    Vous êtes invité à rejoindre{' '}
                    <span className="font-medium text-foreground">
                      {preview.schoolName}
                    </span>{' '}
                    en tant que{' '}
                    <span className="font-medium text-foreground">
                      {roleLabel}
                    </span>
                    .
                  </p>
                  {preview.email ? (
                    <p className="text-xs text-muted-foreground">
                      Utilisez l’e-mail{' '}
                      <span className="font-medium text-foreground">
                        {preview.email}
                      </span>{' '}
                      indiqué lors de l’invitation.
                    </p>
                  ) : null}
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
                    {invalidInviteMessage(preview?.reason)}
                  </p>
                  {preview?.reason === 'expired' && preview.schoolName ? (
                    <p className="text-xs text-muted-foreground">
                      Établissement : {preview.schoolName}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {!hasInvalidInvite ? (
            <StaffJoinForm
              defaultInviteToken={token}
              inviteReadonly={invitationValid && Boolean(inviteFromUrl)}
              defaultEmail={preview?.email ?? ''}
              emailReadonly={Boolean(preview?.email)}
              roleLabel={roleLabel || '—'}
              schoolName={preview?.schoolName}
            />
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Retour à la connexion
              </Link>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
