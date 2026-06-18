import { NextResponse } from 'next/server';
import { requireSchoolFinance } from '@/lib/auth/require-role';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordPayment } from '@/lib/db/payments';
import { getStudentById, getStudentByMatricule } from '@/lib/db/students';
import type { PayFeePayload } from '@/lib/offline/outbox-types';

export const dynamic = 'force-dynamic';

type Body = {
  mutationId: string;
  payload: PayFeePayload;
};

function isUniqueViolation(message: string): boolean {
  return message.includes('23505') || /duplicate|unique/i.test(message);
}

/** Pousse un encaissement local (outbox) vers Supabase. */
export async function POST(request: Request) {
  const { userId, schoolId } = await requireSchoolFinance();

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const { payload } = body;
  if (
    !payload?.studentId ||
    !payload.feeId ||
    !payload.receiptNumber ||
    !payload.amount
  ) {
    return NextResponse.json({ error: 'Mutation incomplète.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('payments_history')
    .select('id, receipt_number, amount_paid, currency')
    .eq('receipt_number', payload.receiptNumber)
    .maybeSingle();
  if (existing) {
    const { data: fee } = await admin
      .from('fees')
      .select('name')
      .eq('id', payload.feeId)
      .maybeSingle();
    return NextResponse.json({
      paymentId: (existing as { id: string }).id,
      receiptNumber: payload.receiptNumber,
      amountPaid: Number((existing as { amount_paid: number }).amount_paid),
      currency: (existing as { currency: string }).currency,
      feeName: (fee as { name: string } | null)?.name ?? '—',
    });
  }

  let studentId = payload.studentId;
  let student = await getStudentById(schoolId, studentId);
  if (!student && payload.studentMatricule) {
    student = await getStudentByMatricule(schoolId, payload.studentMatricule);
    if (student) studentId = student.id;
  }
  if (!student) {
    return NextResponse.json(
      {
        error:
          'Élève introuvable. Synchronisez d’abord l’inscription si le matricule est provisoire.',
      },
      { status: 422 },
    );
  }

  try {
    const result = await recordPayment({
      schoolId,
      studentId,
      feeId: payload.feeId,
      userId,
      amount: payload.amount,
      receiptNumber: payload.receiptNumber,
    });

    return NextResponse.json({
      paymentId: result.paymentId,
      receiptNumber: result.receiptNumber,
      amountPaid: result.amountPaid,
      currency: result.currency,
      feeName: result.feeName,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Encaissement impossible.';

    if (isUniqueViolation(message)) {
      const { data: dup } = await admin
        .from('payments_history')
        .select('id, receipt_number, amount_paid, currency')
        .eq('receipt_number', payload.receiptNumber)
        .maybeSingle();
      if (dup) {
        const { data: fee } = await admin
          .from('fees')
          .select('name')
          .eq('id', payload.feeId)
          .maybeSingle();
        return NextResponse.json({
          paymentId: (dup as { id: string }).id,
          receiptNumber: payload.receiptNumber,
          amountPaid: Number((dup as { amount_paid: number }).amount_paid),
          currency: (dup as { currency: string }).currency,
          feeName: (fee as { name: string } | null)?.name ?? '—',
        });
      }
    }

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
