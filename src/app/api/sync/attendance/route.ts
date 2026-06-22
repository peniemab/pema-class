import { NextResponse } from 'next/server';
import { requireSchoolAttendance } from '@/lib/auth/require-role';
import { upsertAttendancesBatch } from '@/lib/db/attendances';
import { getAttendanceSnapshot } from '@/lib/offline/attendance-snapshot';
import type { SaveAttendanceBatchPayload } from '@/lib/offline/outbox-types';

export const dynamic = 'force-dynamic';

type PushBody = {
  mutationId: string;
  payload: SaveAttendanceBatchPayload;
};

/** Snapshot présences (90 j) pour le cache hors ligne. */
export async function GET() {
  const { schoolId, staffId, role } = await requireSchoolAttendance();
  const snapshot = await getAttendanceSnapshot(schoolId, staffId, role);
  return NextResponse.json(snapshot, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
  });
}

/** Pousse un lot de présences locales (outbox) vers Supabase. */
export async function POST(request: Request) {
  const { staffId } = await requireSchoolAttendance();

  let body: PushBody;
  try {
    body = (await request.json()) as PushBody;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const { payload } = body;
  if (
    !payload?.classId ||
    !payload.date ||
    !Array.isArray(payload.entries) ||
    payload.entries.length === 0
  ) {
    return NextResponse.json({ error: 'Mutation incomplète.' }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    return NextResponse.json({ error: 'Date invalide.' }, { status: 400 });
  }

  try {
    await upsertAttendancesBatch(
      payload.entries.map((e) => ({
        studentId: e.studentId,
        classId: payload.classId,
        date: payload.date,
        status: e.status,
        recordedBy: staffId,
      })),
    );

    return NextResponse.json({ ok: true as const, saved: payload.entries.length });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Enregistrement impossible.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
