import { AcademicYearSection } from '@/components/school/academic-year-section';
import { ClassesSection } from '@/components/school/classes-section';
import { FeesSection } from '@/components/school/fees-section';
import { SchoolCyclesSection } from '@/components/school/school-cycles-section';
import { SchoolLogoSection } from '@/components/school/school-logo-section';
import { loadReferentialsPageData } from '@/lib/school/referentials-actions';

export default async function SchoolReferentielsPage() {
  const data = await loadReferentialsPageData();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Référentiels</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Année scolaire, classes et frais — base pour inscriptions et caisse.
        </p>
      </div>

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
  );
}
