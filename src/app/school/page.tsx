import Link from 'next/link';
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
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Configurez les{' '}
            <Link href="/school/referentiels" className="font-medium text-primary hover:underline">
              référentiels
            </Link>
            , puis{' '}
            <Link href="/school/eleves" className="font-medium text-primary hover:underline">
              inscrivez les élèves
            </Link>{' '}
            et préparez la caisse.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
