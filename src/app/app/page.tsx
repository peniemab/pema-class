import { requireSchoolStaff } from '@/lib/auth/require-role';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function StaffAppPage() {
  const { role } = await requireSchoolStaff();

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Espace personnel</CardTitle>
        <CardDescription>Rôle : {role}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Modules métier (annuaire, caisse) à connecter dans les prochaines phases.
      </CardContent>
    </Card>
  );
}
