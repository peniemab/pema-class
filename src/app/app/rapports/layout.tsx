import { requireSchoolReports } from '@/lib/auth/require-role';

export default async function AppRapportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSchoolReports();
  return children;
}
