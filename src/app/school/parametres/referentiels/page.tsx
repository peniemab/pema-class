import { loadReferentialsPageData } from '@/lib/school/referentials-actions';
import { AcademicYearSection } from '@/components/school/academic-year-section';
import { ClassesSection } from '@/components/school/classes-section';
import { FeesSection } from '@/components/school/fees-section';
import { SchoolCyclesSection } from '@/components/school/school-cycles-section';
import { SchoolLogoSection } from '@/components/school/school-logo-section';
import { SettingsPageHeader, SettingsScreen } from '@/components/school/settings-ui';

export default async function ParametresReferentielsPage() {
  const data = await loadReferentialsPageData();

  return (
    <SettingsScreen className="max-w-3xl">
      <SettingsPageHeader
        title="Référentiels"
        description="Année scolaire, classes et frais — base pour inscriptions et caisse."
      />

      <div className="space-y-6">
        <SchoolCyclesSection school={data.school} />

        <AcademicYearSection
          school={data.school}
          academicYears={data.academicYears}
          activeYear={data.activeYear}
          periods={data.periods}
        />

        <ClassesSection
          school={data.school}
          activeYear={data.activeYear}
          classes={data.classes}
        />

        <FeesSection activeYear={data.activeYear} fees={data.fees} />

        <SchoolLogoSection school={data.school} />
      </div>
    </SettingsScreen>
  );
}
