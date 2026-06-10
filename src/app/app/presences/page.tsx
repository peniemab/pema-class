import { loadAttendancePage } from '@/lib/school/attendance-actions';
import { PresencesPageView } from '@/components/school/presences/presences-page-view';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AppPresencesPage({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadAttendancePage(params, '/app/presences');
  return <PresencesPageView data={data} basePath="/app/presences" />;
}
