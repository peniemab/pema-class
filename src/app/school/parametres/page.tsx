import { loadSchoolSettingsForDirection } from '@/lib/school/settings-actions';
import { SchoolSettingsForm } from '@/components/school/school-settings-form';

export default async function SchoolParametresPage() {
  const school = await loadSchoolSettingsForDirection();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Configuration de votre établissement
        </p>
      </div>
      <SchoolSettingsForm school={school} />
    </div>
  );
}
