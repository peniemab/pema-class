import { notFound } from 'next/navigation';
import { loadStudentDetailPage } from '@/lib/school/students-actions';
import { loadStudentFeesSummary } from '@/lib/school/payments-actions';
import { StudentContactsSection } from '@/components/school/students/student-contacts-section';
import { StudentProfileSections } from '@/components/school/students/student-profile-sections';
import { StudentFeesSection } from '@/components/school/caisse/student-fees-section';
import { EnrollmentPrintLink } from '@/components/documents/document-print-links';
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
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
      {data.enrollment ? (
        <div className="flex justify-end">
          <EnrollmentPrintLink studentId={id} backHref={`/school/eleves/${id}`} />
        </div>
      ) : null}

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
