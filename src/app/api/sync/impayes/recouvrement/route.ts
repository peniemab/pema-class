import { NextRequest, NextResponse } from 'next/server';
import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getImpayesRecouvrementPageData } from '@/lib/db/impayes-page';

export const dynamic = 'force-dynamic';

/** Snapshot recouvrement par frais (overlay workspace). */
export async function GET(request: NextRequest) {
  const { schoolId } = await requireSchoolDirection();
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const data = await getImpayesRecouvrementPageData(schoolId, params);
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
  });
}
