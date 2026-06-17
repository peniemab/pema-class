import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { OnboardingStatusBadge } from '@/components/platform/status-badge';
import { listOnboardingTokens } from '@/lib/db/platform';
import { formatDateTime } from '@/lib/platform/format';
import { OnboardingTokenActions } from '@/components/platform/onboarding-token-actions';
import { ButtonLink } from '@/components/ui/button-link';
import { cn } from '@/lib/utils';

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

const filters = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'En attente' },
  { key: 'used', label: 'Utilisés' },
  { key: 'expired', label: 'Expirés' },
] as const;

export default async function PlatformOnboardingHistoryPage({
  searchParams,
}: PageProps) {
  const { filter: rawFilter } = await searchParams;
  const filter =
    rawFilter === 'pending' ||
    rawFilter === 'used' ||
    rawFilter === 'expired'
      ? rawFilter
      : 'all';

  const tokens = await listOnboardingTokens({
    filter: filter === 'all' ? 'all' : filter,
  });

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <div className="border-b border-wa-divider bg-wa-panel px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-wa-text-primary">
              Liens onboarding
            </h1>
            <p className="text-sm text-wa-text-secondary">
              Historique des tokens générés par la plateforme.
            </p>
          </div>
          <ButtonLink href="/platform/onboarding/new">Nouveau lien</ButtonLink>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={
              f.key === 'all'
                ? '/platform/onboarding'
                : `/platform/onboarding?filter=${f.key}`
            }
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              filter === f.key
                ? 'border-wa-accent bg-primary/10 text-wa-accent'
                : 'border-wa-divider text-wa-text-secondary hover:bg-wa-row-hover',
            )}
          >
            {f.label}
          </Link>
        ))}
        </nav>
      </div>

      <div className="px-4 pt-5">
        {/* Mobile: liste fluide type WhatsApp (évite les tables horizontales) */}
        <div className="space-y-2 md:hidden">
          {tokens.length === 0 ? (
            <p className="rounded-xl border border-dashed border-wa-divider bg-wa-panel px-4 py-8 text-center text-sm text-wa-text-secondary">
              Aucun lien pour ce filtre.
            </p>
          ) : (
            tokens.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-wa-divider bg-wa-panel px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <OnboardingStatusBadge used_at={t.used_at} expires_at={t.expires_at} />
                      <span className="truncate text-sm font-medium text-wa-text-primary">
                        {t.school_id
                          ? t.school_name ?? 'Établissement'
                          : t.draft_school_name ?? '— (pas encore soumis)'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-wa-text-secondary">
                      {t.email ? `Directeur: ${t.email}` : 'Directeur: —'}
                    </p>
                    <p className="mt-1 text-xs text-wa-text-secondary">
                      Expire: {formatDateTime(t.expires_at)}
                    </p>
                    {t.internal_note ? (
                      <p className="mt-1 line-clamp-2 text-xs text-wa-text-secondary">
                        Note: {t.internal_note}
                      </p>
                    ) : null}
                  </div>

                  {t.school_id ? (
                    <Link
                      href={`/platform/schools/${t.school_id}`}
                      className="mt-0.5 inline-flex size-9 items-center justify-center rounded-full text-wa-text-secondary hover:bg-wa-row-hover"
                      aria-label="Voir l'école"
                      title="Voir l'école"
                    >
                      <ChevronRight className="size-5" aria-hidden />
                    </Link>
                  ) : null}
                </div>

                <div className="mt-3">
                  <OnboardingTokenActions
                    tokenId={t.id}
                    onboardingUrl={t.onboarding_url}
                    linkStatus={t.link_status}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto rounded-lg border border-wa-divider bg-wa-panel md:block">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-wa-divider bg-wa-bg text-wa-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">École / brouillon</th>
              <th className="px-4 py-3 font-medium">E-mail directeur</th>
              <th className="px-4 py-3 font-medium">Créé</th>
              <th className="px-4 py-3 font-medium">Expire</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Lien</th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-wa-text-secondary"
                >
                  Aucun lien pour ce filtre.
                </td>
              </tr>
            ) : (
              tokens.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-wa-divider last:border-0 hover:bg-wa-row-hover"
                >
                  <td className="px-4 py-3">
                    <OnboardingStatusBadge
                      used_at={t.used_at}
                      expires_at={t.expires_at}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {t.school_id ? (
                      <Link
                        href={`/platform/schools/${t.school_id}`}
                        className="text-wa-accent hover:underline"
                      >
                        {t.school_name ?? 'Établissement'}
                      </Link>
                    ) : (
                      <span>
                        {t.draft_school_name ?? '— (pas encore soumis)'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-wa-text-secondary">
                    {t.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-wa-text-secondary">
                    {formatDateTime(t.created_at)}
                  </td>
                  <td className="px-4 py-3 text-wa-text-secondary">
                    {formatDateTime(t.expires_at)}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-wa-text-secondary">
                    {t.internal_note ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <OnboardingTokenActions
                      tokenId={t.id}
                      onboardingUrl={t.onboarding_url}
                      linkStatus={t.link_status}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
