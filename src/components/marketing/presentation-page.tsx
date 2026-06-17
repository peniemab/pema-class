import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { LoginLegalFooter } from '@/components/auth/login-legal-footer';
import { PwaInstallButton } from '@/components/pwa/pwa-install-button';
import { PresentationHeader } from '@/components/marketing/presentation-header';
import { ButtonLink } from '@/components/ui/button-link';
import { brand } from '@/lib/brand';
import {
  audienceCards,
  featureBlocks,
  mobilityPoints,
} from '@/lib/marketing/presentation-content';
import { cn } from '@/lib/utils';

const toneClass = {
  blue: 'bg-primary/10 text-primary',
  teal: 'bg-secondary/15 text-secondary',
  indigo: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300',
} as const;

export function PresentationPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PresentationHeader />

      {/* Hero — style Schoolap ALL-IN-ONE */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-background to-background"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" aria-hidden />
              Tout-en-un
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Simplifiez la gestion de votre établissement avec une application{' '}
              <span className="text-primary">rapide, intuitive et complète</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {brand.login.headline} Élèves, caisse, présences et rapports — une
              plateforme privée pour les écoles en RDC.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/" size="lg" className="gap-2">
                Se connecter
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/register" variant="outline" size="lg">
                Créer un établissement
              </ButtonLink>
            </div>
            <p className="text-sm text-muted-foreground">
              Directeur invité ?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Activez votre école en 72 h
              </Link>
              {' · '}
              Personnel ?{' '}
              <Link href="/join" className="font-medium text-primary hover:underline">
                Rejoindre l&apos;équipe
              </Link>
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <BrandMark size="sm" />
                <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-medium text-secondary">
                  En ligne
                </span>
              </div>
              <div className="space-y-3">
                {['Élèves inscrits', 'Encaissements du jour', 'Présences classe 6ème'].map(
                  (label, i) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3"
                    >
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm tabular-nums text-primary">
                        {['248', '12', '94 %'][i]}
                      </span>
                    </div>
                  ),
                )}
              </div>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                Aperçu illustratif — vos données restent privées à votre école.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Profils — 3 cartes comme Schoolap */}
      <section id="profils" className="scroll-mt-20 border-b border-border/60 bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Une solution pour chaque rôle dans l&apos;école
            </h2>
            <p className="mt-3 text-muted-foreground">
              Direction, secrétariat, caisse et enseignants — chacun accède à ce
              dont il a besoin, sans complexité inutile.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {audienceCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span
                    className={cn(
                      'mb-4 inline-flex size-12 items-center justify-center rounded-2xl',
                      toneClass[card.tone],
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                  <a
                    href={card.href}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {card.cta}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobilité / PWA */}
      <section id="mobilite" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10 sm:py-14">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Restez connecté à votre école, où que vous soyez
              </h2>
              <p className="mt-4 text-primary-foreground/85">
                Installez {brand.name} sur votre téléphone — même expérience sur
                mobile et bureau, pensée pour le terrain congolais.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {mobilityPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="rounded-2xl bg-primary-foreground/10 p-5 backdrop-blur"
                  >
                    <Icon className="mb-3 size-8 text-primary-foreground/90" aria-hidden />
                    <h3 className="font-medium">{point.title}</h3>
                    <p className="mt-1 text-sm text-primary-foreground/80">{point.text}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex justify-center">
              <PwaInstallButton variant="banner" className="max-w-lg border-primary-foreground/20 bg-primary-foreground/10 [&_p]:text-primary-foreground [&_.text-muted-foreground]:text-primary-foreground/80" />
            </div>
          </div>
        </div>
      </section>

      {/* Blocs fonctionnalités alternés */}
      <section id="fonctionnalites" className="scroll-mt-20 border-t border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl space-y-20 px-4 sm:px-6">
          {featureBlocks.map((block) => {
            const Icon = block.icon;
            return (
              <article
                key={block.id}
                id={block.id}
                className={cn(
                  'grid scroll-mt-24 items-center gap-10 lg:grid-cols-2',
                  block.reverse && 'lg:[&>*:first-child]:order-2',
                )}
              >
                <div className="space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {block.eyebrow}
                  </p>
                  <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">
                    {block.title}
                  </h3>
                  <p className="text-muted-foreground">{block.description}</p>
                  <ul className="space-y-2">
                    {block.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm">
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-secondary"
                          aria-hidden
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href={block.href} className="gap-2">
                    {block.cta}
                    <ArrowRight className="size-4" aria-hidden />
                  </ButtonLink>
                </div>
                <div
                  className="flex aspect-[4/3] items-center justify-center rounded-3xl border border-border bg-gradient-to-br from-muted to-background p-8"
                  aria-hidden
                >
                  <Icon className="size-24 text-primary/25 sm:size-32" strokeWidth={1.25} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA final + contact */}
      <section id="contact" className="scroll-mt-20 border-t border-border/60 bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Prêt à moderniser votre établissement ?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Demandez une démonstration ou connectez-vous si votre école est déjà
            configurée sur {brand.name}.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/" size="lg" className="w-full sm:w-auto">
              Se connecter
            </ButtonLink>
            <ButtonLink
              href="/register"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Demander un accès directeur
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Plateforme multi-établissements — chaque école dispose de son espace
            sécurisé et isolé.
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 sm:px-6">
          <BrandMark size="sm" orientation="center" />
          <LoginLegalFooter />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {brand.name}. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
