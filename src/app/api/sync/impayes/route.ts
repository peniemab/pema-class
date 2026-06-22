import { NextRequest, NextResponse } from 'next/server';
import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getImpayesPageData } from '@/lib/db/impayes-page';

export const dynamic = 'force-dynamic';

/** Snapshot impayés direction (stats + liste paginée). */
export async function GET(request: NextRequest) {
  const { schoolId } = await requireSchoolDirection();
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const data = await getImpayesPageData(schoolId, params);
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
  });
}
