import { SchoolStatusBadge } from '@/components/platform/status-badge';
import { SchoolStatusActions } from '@/components/platform/school-status-actions';
import { listPlatformSchools } from '@/lib/db/platform';
import { formatDateTime, staffDisplayName } from '@/lib/platform/format';
import { ButtonLink } from '@/components/ui/button-link';

export default async function PlatformSchoolsPage() {
  const schools = await listPlatformSchools();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Établissements</h1>
        <p className="text-muted-foreground">
          Tenants de la plateforme — gestion multi-écoles.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
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
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aucun établissement.
                </td>
              </tr>
            ) : (
              schools.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {s.slug ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <SchoolStatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    {s.director ? (
                      <div className="flex flex-col">
                        <span>{staffDisplayName(s.director)}</span>
                        <span className="text-xs text-muted-foreground">
                          {s.director.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {s.active_staff_count}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
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
    </main>
  );
}
