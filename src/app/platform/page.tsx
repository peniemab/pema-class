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

export default async function PlatformDashboardPage() {
  const [stats, schools, onboarding] = await Promise.all([
    getPlatformSchoolStats(),
    listPlatformSchools(),
    getRecentOnboardingSummary(),
  ]);

  const recentSchools = schools.slice(0, 5);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de la plateforme SaaS multi-établissements.
          </p>
        </div>
        <ButtonLink href="/platform/onboarding/new">
          Nouveau lien onboarding
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Établissements" value={stats.total} hint="Total enregistrés" />
        <StatCard title="Actifs" value={stats.active} hint="Statut actif" />
        <StatCard
          title="Suspendus"
          value={stats.suspended}
          hint="Accès bloqué"
        />
        <StatCard
          title="Archivés"
          value={stats.archived}
          hint="Hors service"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/platform/schools/${s.id}`}
                      className="min-w-0 font-medium hover:underline"
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
                    className="flex flex-col gap-1 rounded-md border border-border px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
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
    </main>
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
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
