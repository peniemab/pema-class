import { requireSchoolDirection } from '@/lib/auth/require-role';
import {
  getImpayesPageData,
  getImpayesRecouvrementPageData,
} from '@/lib/db/impayes-page';

export async function loadImpayesPage(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId } = await requireSchoolDirection();
  return getImpayesPageData(schoolId, searchParams);
}

export async function loadImpayesRecouvrementPage(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId } = await requireSchoolDirection();
  return getImpayesRecouvrementPageData(schoolId, searchParams);
}
