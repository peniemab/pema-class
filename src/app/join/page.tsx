import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  TriangleAlert,
} from 'lucide-react';
import { brand } from '@/lib/brand';
import { StaffJoinForm } from '@/components/auth/staff-join-form';
import {
  peekStaffInvitation,
  extractStaffInviteToken,
} from '@/lib/db/invitations';
import { staffRoleLabel } from '@/lib/auth/types';

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
    <main className="min-h-dvh bg-wa-bg px-4 py-6 safe-top safe-bottom sm:px-6">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <header className="flex items-center gap-3">
          <Link
            href="/"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-wa-text-secondary transition-colors hover:bg-wa-panel"
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-wa-text-primary">
              {brand.name}
            </p>
            <p className="truncate text-xs text-wa-text-secondary">
              Rejoindre un établissement
            </p>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border border-wa-divider bg-wa-panel">
          <div className="border-b border-wa-divider bg-wa-header px-4 py-4 text-wa-header-foreground">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Users className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight">
                  Compte collaborateur
                </h1>
                <p className="text-sm text-white/80">
                  Même espace que la direction, accès selon votre rôle.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-4 sm:p-5">
            {invitationValid && preview?.schoolName && roleLabel ? (
              <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-4 text-sm">
                <div className="flex gap-3">
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-secondary"
                    aria-hidden
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-wa-text-primary">
                      Invitation {brand.name} détectée
                    </p>
                    <p className="text-wa-text-secondary">
                      <span className="font-medium text-wa-text-primary">
                        {preview.schoolName}
                      </span>{' '}
                      · {roleLabel}
                    </p>
                    {preview.email ? (
                      <p className="text-xs text-wa-text-secondary">
                        E-mail attendu :{' '}
                        <span className="font-medium text-wa-text-primary">
                          {preview.email}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {hasInvalidInvite ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
                <div className="flex gap-3">
                  <TriangleAlert
                    className="mt-0.5 size-5 shrink-0 text-destructive"
                    aria-hidden
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-wa-text-primary">
                      Lien d&apos;invitation invalide ou expiré
                    </p>
                    <p className="text-wa-text-secondary">
                      {invalidInviteMessage(preview?.reason)}
                    </p>
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
              <p className="text-center text-sm text-wa-text-secondary">
                <Link
                  href="/"
                  className="font-medium text-wa-accent underline-offset-4 hover:underline"
                >
                  Retour à la connexion
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
