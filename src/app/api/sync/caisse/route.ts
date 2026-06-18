import { NextResponse } from 'next/server';
import { requireSchoolFinance } from '@/lib/auth/require-role';
import { getCaisseSnapshot } from '@/lib/offline/caisse-snapshot';

export const dynamic = 'force-dynamic';

/** Snapshot caisse pour le cache hors ligne. Auth finance obligatoire. */
export async function GET() {
  const { schoolId } = await requireSchoolFinance();
  const snapshot = await getCaisseSnapshot(schoolId);
  return NextResponse.json(snapshot, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
  });
}
