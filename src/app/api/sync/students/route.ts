import { NextResponse } from 'next/server';
import { requireSchoolEnrollment } from '@/lib/auth/require-role';
import { getStudentsSnapshot } from '@/lib/offline/students-snapshot';

export const dynamic = 'force-dynamic';

/** Snapshot Élèves pour le cache hors ligne. Auth direction obligatoire. */
export async function GET() {
  const { schoolId } = await requireSchoolEnrollment();
  const snapshot = await getStudentsSnapshot(schoolId);
  return NextResponse.json(snapshot, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
  });
}
