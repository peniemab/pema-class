import type { ComponentType } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OnboardingTokenActions } from '@/components/platform/onboarding-token-actions';
import { OnboardingStatusBadge } from '@/components/platform/status-badge';
import { SchoolStatusBadge } from '@/components/platform/status-badge';
import {
  getPlatformSchoolStats,
  listPlatformSchools,
  getRecentOnboardingSummary,
} from '@/lib/db/platform';
import { formatDateTime } from '@/lib/platform/format';
import { ButtonLink } from '@/components/ui/button-link';
import { cn } from '@/lib/utils';
import { Building2, History, Link2 } from 'lucide-react';

export default async function PlatformDashboardPage() {
  const [stats, schools, onboarding] = await Promise.all([
    getPlatformSchoolStats(),
    listPlatformSchools(),
    getRecentOnboardingSummary(),
  ]);

  const recentSchools = schools.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <div className="border-b border-wa-divider bg-wa-panel px-4 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-wa-text-primary">
              Tableau de bord
            </h1>
            <p className="text-sm text-wa-text-secondary">
              Vue d&apos;ensemble de la plateforme SaaS multi-établissements.
            </p>
          </div>
          <ButtonLink href="/platform/onboarding/new" className="w-full sm:w-auto">
            Nouveau lien onboarding
          </ButtonLink>
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* Mobile-first shortcuts façon WhatsApp Business */}
        <section className="md:hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-wa-text-secondary">
            Raccourcis
          </p>
          <div className="grid grid-cols-2 gap-3">
            <QuickTile
              href="/platform/schools"
              label="Écoles"
              description="Tenants & statuts"
              icon={Building2}
              tone="blue"
            />
            <QuickTile
              href="/platform/onboarding"
              label="Onboarding"
              description="Historique des liens"
              icon={History}
              tone="indigo"
            />
            <QuickTile
              href="/platform/onboarding/new"
              label="Nouveau lien"
              description="Créer un token 72h"
              icon={Link2}
              tone="teal"
            />
            <QuickTile
              href="/platform"
              label="Synthèse"
              description="KPIs & récents"
              icon={Building2}
              tone="green"
            />
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Établissements" value={stats.total} hint="Total enregistrés" />
          <StatCard title="Actifs" value={stats.active} hint="Statut actif" />
          <StatCard title="Suspendus" value={stats.suspended} hint="Accès bloqué" />
          <StatCard title="Archivés" value={stats.archived} hint="Hors service" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Derniers établissements</CardTitle>
              <CardDescription>Créations récentes</CardDescription>
            </div>
            <ButtonLink variant="ghost" size="sm" href="/platform/schools">
              Tout voir
            </ButtonLink>
          </CardHeader>
          <CardContent>
            {recentSchools.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun établissement pour le moment.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentSchools.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-wa-divider bg-wa-panel px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/platform/schools/${s.id}`}
                      className="min-w-0 font-medium text-wa-text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                    <SchoolStatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liens onboarding</CardTitle>
            <CardDescription>
              {onboarding.pending} en attente · {onboarding.used} utilisés ·{' '}
              {onboarding.expired} expirés
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href="/platform/onboarding?filter=pending"
                className="text-primary underline-offset-4 hover:underline"
              >
                En attente
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link
                href="/platform/onboarding?filter=used"
                className="text-primary underline-offset-4 hover:underline"
              >
                Utilisés
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link
                href="/platform/onboarding?filter=expired"
                className="text-primary underline-offset-4 hover:underline"
              >
                Expirés
              </Link>
            </div>
            {onboarding.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun lien généré.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {onboarding.recent.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-col gap-1 rounded-xl border border-wa-divider bg-wa-panel px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-wa-text-primary">
                        {t.school_name ?? t.email ?? 'Nouvel établissement'}
                      </span>
                      <OnboardingStatusBadge
                        used_at={t.used_at}
                        expires_at={t.expires_at}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Créé {formatDateTime(t.created_at)} · expire{' '}
                      {formatDateTime(t.expires_at)}
                    </span>
                    <OnboardingTokenActions
                      tokenId={t.id}
                      onboardingUrl={t.onboarding_url}
                      linkStatus={t.link_status}
                    />
                  </li>
                ))}
              </ul>
            )}
            <ButtonLink
              variant="outline"
              size="sm"
              className="w-fit"
              href="/platform/onboarding"
            >
              Historique complet
            </ButtonLink>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

function QuickTile({
  href,
  label,
  description,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: 'green' | 'teal' | 'blue' | 'indigo';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
      : tone === 'teal'
        ? 'bg-teal-500/12 text-teal-700 dark:text-teal-400'
        : tone === 'indigo'
          ? 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-400'
          : 'bg-sky-500/12 text-sky-700 dark:text-sky-400';

  return (
    <Link
      href={href}
      className="rounded-xl border border-wa-divider bg-wa-panel p-4 transition-colors hover:bg-wa-row-hover active:bg-wa-row-active"
    >
      <span className={cn('mb-2 inline-flex size-10 items-center justify-center rounded-full', toneClass)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="block text-sm font-medium text-wa-text-primary">{label}</span>
      <span className="mt-1 block text-xs text-wa-text-secondary">{description}</span>
    </Link>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-wa-divider bg-wa-panel px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-wa-text-primary">{title}</span>
        <span className="shrink-0 text-2xl font-semibold tabular-nums text-wa-text-primary">
          {value}
        </span>
      </div>
      <p className="mt-1 text-xs text-wa-text-secondary">{hint}</p>
    </div>
  );
}
