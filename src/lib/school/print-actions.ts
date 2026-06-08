'use server';

import { requireSchoolFinance } from '@/lib/auth/require-role';
import {
  getEnrollmentFicheDocument,
  getPaymentReceiptDocument,
} from '@/lib/documents/loaders';

export async function loadPaymentReceiptDocument(paymentId: string) {
  const { schoolId } = await requireSchoolFinance();
  return getPaymentReceiptDocument(schoolId, paymentId);
}

export async function loadEnrollmentFicheDocument(studentId: string) {
  const { schoolId } = await requireSchoolFinance();
  return getEnrollmentFicheDocument(schoolId, studentId);
}
