import Link from 'next/link';
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
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Liens onboarding
          </h1>
          <p className="text-muted-foreground">
            Historique des tokens générés par la plateforme.
          </p>
        </div>
        <ButtonLink href="/platform/onboarding/new">Nouveau lien</ButtonLink>
      </div>

      <nav className="flex flex-wrap gap-2">
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
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50',
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
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
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucun lien pour ce filtre.
                </td>
              </tr>
            ) : (
              tokens.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
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
                        className="text-primary hover:underline"
                      >
                        {t.school_name ?? 'Établissement'}
                      </Link>
                    ) : (
                      <span>
                        {t.draft_school_name ?? '— (pas encore soumis)'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(t.created_at)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(t.expires_at)}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
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
    </main>
  );
}
