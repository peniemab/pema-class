import { notFound } from 'next/navigation';
import { SchoolStatusBadge } from '@/components/platform/status-badge';
import { SchoolStatusActions } from '@/components/platform/school-status-actions';
import { RegenerateOnboardingButton } from '@/components/platform/regenerate-onboarding-button';
import {
  directorNeedsOnboarding,
  getPlatformSchoolById,
  listSchoolStaff,
} from '@/lib/db/platform';
import { formatDateTime, staffDisplayName } from '@/lib/platform/format';
import { staffRoleLabel } from '@/lib/platform/role-labels';
import { ButtonLink } from '@/components/ui/button-link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlatformSchoolDetailPage({ params }: PageProps) {
  const { id } = await params;
  const school = await getPlatformSchoolById(id);

  if (!school) {
    notFound();
  }

  const [staff, showRegenerate] = await Promise.all([
    listSchoolStaff(id),
    directorNeedsOnboarding(id),
  ]);

  const director = school.director;

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <div className="border-b border-wa-divider bg-wa-panel px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <ButtonLink variant="ghost" size="sm" className="-ml-2 w-fit" href="/platform/schools">
              ← Retour à la liste
            </ButtonLink>
            <h1 className="mt-2 text-lg font-semibold tracking-tight text-wa-text-primary">
              {school.name}
            </h1>
            <p className="font-mono text-xs text-wa-text-secondary">
              {school.slug ?? '—'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SchoolStatusBadge status={school.status} />
            <SchoolStatusActions schoolId={school.id} status={school.status} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Établissement</CardTitle>
            <CardDescription>Informations tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Statut">
              <SchoolStatusBadge status={school.status} />
            </Row>
            <Row label="Créé le">{formatDateTime(school.created_at)}</Row>
            <Row label="Staff actifs">{school.active_staff_count}</Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Directeur</CardTitle>
            <CardDescription>Rôle school_admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {director ? (
              <>
                <Row label="Nom">{staffDisplayName(director)}</Row>
                <Row label="E-mail">{director.email}</Row>
                <Row label="Compte Supabase">
                  {director.user_id ? 'Compte lié' : 'Pas encore inscrit'}
                </Row>
              </>
            ) : (
              <p className="text-muted-foreground">
                Aucun directeur enregistré — utilisez un lien onboarding.
              </p>
            )}
            {showRegenerate && (
              <RegenerateOnboardingButton schoolId={school.id} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Personnel</CardTitle>
          <CardDescription>
            Lecture seule — les invitations staff se font côté école (
            Paramètres → Équipe).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-wa-divider bg-wa-bg text-wa-text-secondary">
              <tr>
                <th className="pb-2 font-medium">Nom</th>
                <th className="pb-2 font-medium">Rôle</th>
                <th className="pb-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-wa-text-secondary">
                    Aucun membre du personnel.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="border-t border-wa-divider hover:bg-wa-row-hover">
                    <td className="py-2">
                      <div className="flex flex-col">
                        <span>{staffDisplayName(member)}</span>
                        <span className="text-xs text-wa-text-secondary">
                          {member.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-2">{staffRoleLabel(member.role)}</td>
                    <td className="py-2 capitalize">{member.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-36 shrink-0 text-wa-text-secondary">{label}</span>
      <span>{children}</span>
    </div>
  );
}
