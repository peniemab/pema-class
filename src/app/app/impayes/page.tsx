import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { requireSchoolStaff } from '@/lib/auth/require-role';
import { loadTeacherImpayesPage } from '@/lib/school/load-teacher-impayes-page';
import { TeacherImpayesView } from '@/components/school/impayes/teacher-impayes-view';
import { getSchoolFeeCurrencies } from '@/lib/school/fee-currencies';
import { listFeesForAcademicYearLabel } from '@/lib/db/fees';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AppTeacherImpayesPage({ searchParams }: Props) {
  const { role, schoolId } = await requireSchoolStaff();
  if (role !== 'enseignant') {
    redirect('/app');
  }

  const params = await searchParams;
  const data = await loadTeacherImpayesPage(params);
  const fees = data.activeYear
    ? await listFeesForAcademicYearLabel(schoolId, data.activeYear.name)
    : [];
  const feeCurrencies = getSchoolFeeCurrencies(fees);

  return (
    <Suspense fallback={null}>
      <TeacherImpayesView data={data} feeCurrencies={feeCurrencies} />
    </Suspense>
  );
}
