import { NextResponse } from 'next/server';
import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getDashboardPageData } from '@/lib/db/dashboard-page';

export const dynamic = 'force-dynamic';

/** Données du tableau de bord direction (chargées après le squelette). */
export async function GET() {
  const { schoolId } = await requireSchoolDirection();
  const data = await getDashboardPageData(schoolId);
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
  });
}
