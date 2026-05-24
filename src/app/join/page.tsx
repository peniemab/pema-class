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
import { createAdminClient } from '@/lib/supabase/admin';

type PageProps = {
  searchParams: Promise<{ invite?: string }>;
};

async function getStaffInviteEmail(token: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('invitations')
      .select('email')
      .eq('token', token)
      .eq('invite_type', 'staff_join')
      .maybeSingle();
    return data?.email ?? null;
  } catch {
    return null;
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
  const inviteEmail =
    invitationValid && token ? await getStaffInviteEmail(token) : null;

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
                direction.
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
                      ? 'Impossible de vérifier l’invitation. Contactez la direction ou réessayez plus tard.'
                      : preview?.reason === 'wrong_invite_type'
                        ? 'Ce lien est réservé à la création du compte directeur. Utilisez /register.'
                        : 'Contactez la direction de votre établissement pour recevoir une nouvelle invitation.'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <StaffJoinForm
            defaultInviteToken={token}
            inviteReadonly={invitationValid && Boolean(inviteFromUrl)}
            defaultEmail={inviteEmail ?? ''}
            emailReadonly={Boolean(inviteEmail)}
            roleLabel={roleLabel || '—'}
            schoolName={preview?.schoolName}
          />
        </section>
      </div>
    </main>
  );
}
