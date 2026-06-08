import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { loadStudentDetailPage } from '@/lib/school/students-actions';
import { loadStudentFeesSummary } from '@/lib/school/payments-actions';
import { StudentContactsSection } from '@/components/school/students/student-contacts-section';
import { StudentProfileSections } from '@/components/school/students/student-profile-sections';
import { StudentFeesSection } from '@/components/school/caisse/student-fees-section';
import { studentFullName } from '@/lib/school/students/constants';
import { EnrollmentPrintLink } from '@/components/documents/document-print-links';
import { ButtonLink } from '@/components/ui/button-link';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  const [data, feesData] = await Promise.all([
    loadStudentDetailPage(id),
    loadStudentFeesSummary(id),
  ]);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <ButtonLink variant="ghost" size="sm" href="/school/eleves" className="-ml-2 gap-1.5">
            <ArrowLeft className="size-4" aria-hidden />
            Annuaire
          </ButtonLink>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {studentFullName(data.student.last_name, data.student.first_name)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fiche élève — matricule {data.student.matricule ?? '—'}
          </p>
        </div>
        {data.enrollment ? (
          <EnrollmentPrintLink
            studentId={id}
            backHref={`/school/eleves/${id}`}
          />
        ) : null}
      </div>

      <StudentProfileSections
        student={data.student}
        enrollment={data.enrollment}
        activeYearName={data.activeYear?.name ?? null}
        classes={data.classes}
      />

      {feesData ? (
        <StudentFeesSection
          studentId={id}
          activeYearName={feesData.activeYear?.name ?? null}
          balances={feesData.balances}
        />
      ) : null}

      <StudentContactsSection
        studentId={data.student.id}
        contacts={data.contacts}
      />
    </div>
  );
}
