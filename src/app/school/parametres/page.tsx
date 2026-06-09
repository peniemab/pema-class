import { BookOpen, Building2 } from 'lucide-react';
import { loadReferentialsPageData } from '@/lib/school/referentials-actions';
import { loadSchoolSettingsForDirection } from '@/lib/school/settings-actions';
import {
  SettingsGroup,
  SettingsRow,
  SettingsScreen,
} from '@/components/school/settings-ui';

export default async function SchoolParametresPage() {
  const [school, referentials] = await Promise.all([
    loadSchoolSettingsForDirection(),
    loadReferentialsPageData(),
  ]);

  const schoolLabel = school.display_name ?? school.name;
  const referentialsDetail = referentials.activeYear
    ? `${referentials.activeYear.name} · ${referentials.classes.length} classe${referentials.classes.length > 1 ? 's' : ''}`
    : 'Année non configurée';

  return (
    <SettingsScreen>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configuration de l&apos;établissement
        </p>
      </div>

      <SettingsGroup title="Général">
        <SettingsRow
          href="/school/parametres/etablissement"
          icon={<Building2 aria-hidden />}
          label="Établissement"
          detail={schoolLabel}
        />
        <SettingsRow
          href="/school/parametres/referentiels"
          icon={<BookOpen aria-hidden />}
          label="Référentiels"
          detail={referentialsDetail}
        />
      </SettingsGroup>
    </SettingsScreen>
  );
}
