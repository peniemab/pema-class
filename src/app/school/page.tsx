import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getSchoolByIdForStaff } from '@/lib/db/schools';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function SchoolDashboardPage() {
  const { schoolId } = await requireSchoolDirection();
  const school = await getSchoolByIdForStaff(schoolId);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{school?.display_name ?? school?.name ?? 'Établissement'}</CardTitle>
          <CardDescription>Espace direction — administration de l’école</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Phases à venir : annuaire élèves, caisse, inscriptions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
