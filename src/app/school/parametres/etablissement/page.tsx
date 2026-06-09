import { loadSchoolSettingsForDirection } from '@/lib/school/settings-actions';
import { SchoolSettingsForm } from '@/components/school/school-settings-form';
import { SettingsPageHeader, SettingsScreen } from '@/components/school/settings-ui';

export default async function ParametresEtablissementPage() {
  const school = await loadSchoolSettingsForDirection();

  return (
    <SettingsScreen>
      <SettingsPageHeader
        title="Établissement"
        description="Nom, coordonnées et identité légale."
      />
      <SchoolSettingsForm school={school} />
    </SettingsScreen>
  );
}
