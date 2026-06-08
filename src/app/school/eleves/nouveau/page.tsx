import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { loadEnrollStudentPage } from '@/lib/school/students-actions';
import { EnrollStudentForm } from '@/components/school/students/enroll-student-form';
import { ButtonLink } from '@/components/ui/button-link';

export default async function EnrollStudentPage() {
  const data = await loadEnrollStudentPage();
  if (!data) {
    redirect('/school/eleves');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <ButtonLink variant="ghost" size="sm" href="/school/eleves" className="-ml-2 gap-1.5">
          <ArrowLeft className="size-4" aria-hidden />
          Annuaire
        </ButtonLink>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Inscrire un élève
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Année {data.activeYear.name} — identité, classe et contacts d&apos;urgence.
        </p>
      </div>

      <EnrollStudentForm
        activeYearName={data.activeYear.name}
        classes={data.classes}
      />
    </div>
  );
}
