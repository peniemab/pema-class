import { ParametresScreen } from '@/components/school/parametres-screen';
import { loadReferentialsPageData } from '@/lib/school/referentials-actions';
import { loadSchoolSettingsForDirection } from '@/lib/school/settings-actions';
import { loadTeamPageData } from '@/lib/school/team-actions';

export default async function SchoolParametresPage() {
  const [school, referentials, team] = await Promise.all([
    loadSchoolSettingsForDirection(),
    loadReferentialsPageData(),
    loadTeamPageData(),
  ]);

  return (
    <ParametresScreen school={school} referentials={referentials} team={team} />
  );
}
