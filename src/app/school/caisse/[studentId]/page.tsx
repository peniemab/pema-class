import { CaisseStudentPage } from '@/components/school/caisse/caisse-student-page';

type Props = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ nouveau?: string }>;
};

export default async function SchoolCaisseStudentPage({
  params,
  searchParams,
}: Props) {
  const { studentId } = await params;
  const { nouveau } = await searchParams;
  return (
    <CaisseStudentPage
      studentId={studentId}
      caisseBasePath="/school/caisse"
      isNewEnrollment={nouveau === '1'}
    />
  );
}
