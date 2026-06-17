import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { ProfessionalLoginForm } from '@/components/auth/professional-login-form';
import { PwaDownloadLink } from '@/components/auth/pwa-download-link';
import { LoginLegalFooter } from '@/components/auth/login-legal-footer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { brand } from '@/lib/brand';

type PageProps = { searchParams: Promise<{ error?: string; password_reset?: string }> };

export default async function LoginPage({ searchParams }: PageProps) {
  const { error, password_reset } = await searchParams;
  const noProfile = error === 'no_profile';
  const resetOk = password_reset === '1';

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-2">
      {/* Colonne gauche — formulaire */}
      <section className="flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex justify-center pt-2 lg:justify-start lg:pt-4">
          <BrandMark orientation="center" showSubtitle={false} size="md" />
        </header>

        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="space-y-3 text-center lg:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {brand.login.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Lien d&apos;invitation directeur ?{' '}
                <Link
                  href="/register"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Créer l&apos;établissement
                </Link>
                {' · '}
                Collaborateur ?{' '}
                <Link
                  href="/join"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Rejoindre l&apos;équipe
                </Link>
              </p>
            </div>

            {noProfile && (
              <Alert variant="destructive">
                <AlertDescription>
                  Compte connecté sans profil établissement. Contactez
                  l&apos;administrateur plateforme ou utilisez votre lien
                  d&apos;invitation.
                </AlertDescription>
              </Alert>
            )}

            {resetOk && (
              <Alert>
                <AlertDescription>
                  Mot de passe mis à jour. Connectez-vous avec votre e-mail et votre nouveau mot de passe.
                </AlertDescription>
              </Alert>
            )}

            <ProfessionalLoginForm />

            <p className="text-center text-sm lg:text-left">
              <Link
                href="/obtenir"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Un problème pour vous connecter ?
              </Link>
            </p>

            <div className="text-center lg:text-left">
              <PwaDownloadLink />
            </div>
          </div>
        </div>

        <footer className="pb-4 pt-6">
          <LoginLegalFooter />
        </footer>
      </section>

      {/* Colonne droite — marketing (desktop) */}
      <aside className="hidden min-h-dvh flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <BrandMark tone="inverse" size="lg" />

        <div className="max-w-lg space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            {brand.login.partnerLabel}
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            {brand.login.headline}
          </h2>
          <p className="text-base leading-relaxed text-primary-foreground/85">
            {brand.login.modulesLine}
          </p>
        </div>

        <div className="rounded-3xl bg-primary-foreground/10 p-6 backdrop-blur">
          <p className="text-sm leading-relaxed text-primary-foreground/90">
            {brand.login.offersCard}
          </p>
          <Link
            href="/offres"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground underline-offset-4 hover:underline"
          >
            {brand.login.offersLinkLabel}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      </aside>
    </main>
  );
}
