import { SchoolStatusBadge } from '@/components/platform/status-badge';
import { SchoolStatusActions } from '@/components/platform/school-status-actions';
import { listPlatformSchools } from '@/lib/db/platform';
import { formatDateTime, staffDisplayName } from '@/lib/platform/format';
import { ButtonLink } from '@/components/ui/button-link';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default async function PlatformSchoolsPage() {
  const schools = await listPlatformSchools();

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <div className="border-b border-wa-divider bg-wa-panel px-4 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-wa-text-primary">
          Établissements
        </h1>
        <p className="text-sm text-wa-text-secondary">
          Tenants de la plateforme — gestion multi-écoles.
        </p>
      </div>

      <div className="px-4 pt-5">
        {/* Mobile: liste fluide type WhatsApp */}
        <div className="space-y-2 md:hidden">
          {schools.length === 0 ? (
            <p className="rounded-xl border border-dashed border-wa-divider bg-wa-panel px-4 py-8 text-center text-sm text-wa-text-secondary">
              Aucun établissement.
            </p>
          ) : (
            schools.map((s) => (
              <Link
                key={s.id}
                href={`/platform/schools/${s.id}`}
                className="flex items-center gap-3 rounded-xl border border-wa-divider bg-wa-panel px-4 py-3 transition-colors hover:bg-wa-row-hover active:bg-wa-row-active"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-wa-text-primary">
                      {s.name}
                    </span>
                    <SchoolStatusBadge status={s.status} />
                  </span>
                  <span className="mt-1 block text-xs text-wa-text-secondary">
                    {s.director ? s.director.email : 'Directeur: —'}
                    {' · '}
                    {s.active_staff_count} staff actif
                    {s.active_staff_count > 1 ? 's' : ''}
                  </span>
                  <span className="mt-1 block text-xs text-wa-text-secondary">
                    Créé: {formatDateTime(s.created_at)}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-wa-text-secondary/60" aria-hidden />
              </Link>
            ))
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto rounded-lg border border-wa-divider bg-wa-panel md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-wa-divider bg-wa-bg text-wa-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Directeur</th>
              <th className="px-4 py-3 font-medium">Staff actifs</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-wa-text-secondary"
                >
                  Aucun établissement.
                </td>
              </tr>
            ) : (
              schools.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-wa-divider last:border-0 hover:bg-wa-row-hover"
                >
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-wa-text-secondary">
                    {s.slug ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <SchoolStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    {s.director ? (
                      <div className="flex flex-col">
                        <span>{staffDisplayName(s.director)}</span>
                        <span className="text-xs text-wa-text-secondary">
                          {s.director.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-wa-text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {s.active_staff_count}
                  </td>
                  <td className="px-4 py-3 text-wa-text-secondary">
                    {formatDateTime(s.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ButtonLink
                        size="sm"
                        variant="outline"
                        href={`/platform/schools/${s.id}`}
                      >
                        Voir fiche
                      </ButtonLink>
                      <SchoolStatusActions
                        schoolId={s.id}
                        status={s.status}
                        compact
                      />
                    </div>
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
