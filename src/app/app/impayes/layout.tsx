import { redirect } from 'next/navigation';
import { requireSchoolStaff } from '@/lib/auth/require-role';

export default async function AppImpayesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireSchoolStaff();
  if (role !== 'enseignant') {
    redirect('/app');
  }
  return children;
}
