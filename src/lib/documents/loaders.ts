import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { getSchoolByIdForStaff } from '@/lib/db/schools';
import {
  getStudentById,
  getStudentEnrollmentForYear,
  listEmergencyContacts,
} from '@/lib/db/students';
import {
  type EnrollmentFicheDocument,
  type PaymentReceiptDocument,
  toSchoolDocumentInfo,
} from '@/lib/documents/types';
import { classDisplayLabel } from '@/lib/school/students/constants';

export async function getPaymentReceiptDocument(
  schoolId: string,
  paymentId: string,
): Promise<PaymentReceiptDocument | null> {
  const admin = createAdminClient();
  const { data: payment, error } = await admin
    .from('payments_history')
    .select(
      'id, student_id, fee_id, amount_paid, currency, receipt_number, created_at',
    )
    .eq('id', paymentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!payment) return null;

  const student = await getStudentById(schoolId, payment.student_id as string);
  if (!student) return null;

  const { data: fee, error: feeError } = await admin
    .from('fees')
    .select('name, academic_year, school_id')
    .eq('id', payment.fee_id as string)
    .eq('school_id', schoolId)
    .maybeSingle();
  if (feeError) throw new Error(feeError.message);
  if (!fee) return null;

  const school = await getSchoolByIdForStaff(schoolId);
  if (!school) return null;

  const activeYear = await getActiveAcademicYear(schoolId);
  let classLabel: string | null = null;
  if (activeYear) {
    const enrollment = await getStudentEnrollmentForYear(
      schoolId,
      student.id,
      activeYear.id,
    );
    if (enrollment) {
      classLabel = classDisplayLabel(
        enrollment.class_level,
        enrollment.class_name,
      );
    }
  }

  return {
    school: toSchoolDocumentInfo(school),
    payment: {
      id: payment.id as string,
      receipt_number: payment.receipt_number as string,
      amount_paid: Number(payment.amount_paid),
      currency: payment.currency as string,
      created_at: payment.created_at as string,
    },
    fee: {
      name: fee.name as string,
      academic_year: fee.academic_year as string,
    },
    student: {
      last_name: student.last_name,
      first_name: student.first_name,
      matricule: student.matricule,
    },
    classLabel,
  };
}

export async function getEnrollmentFicheDocument(
  schoolId: string,
  studentId: string,
): Promise<EnrollmentFicheDocument | null> {
  const student = await getStudentById(schoolId, studentId);
  if (!student) return null;

  const school = await getSchoolByIdForStaff(schoolId);
  if (!school) return null;

  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;

  const [enrollment, contacts] = await Promise.all([
    getStudentEnrollmentForYear(schoolId, studentId, activeYear.id),
    listEmergencyContacts(studentId),
  ]);
  if (!enrollment) return null;

  return {
    school: toSchoolDocumentInfo(school),
    academicYear: activeYear.name,
    student: {
      last_name: student.last_name,
      first_name: student.first_name,
      matricule: student.matricule,
      birth_date: student.birth_date,
      lieu_naissance: student.lieu_naissance,
      ecole_provenance: student.ecole_provenance,
      gender: student.gender,
      address: student.address,
    },
    classLabel: classDisplayLabel(
      enrollment.class_level,
      enrollment.class_name,
    ),
    enrolledAt: enrollment.enrolled_at,
    contacts: contacts.map((c) => ({
      full_name: c.full_name,
      relationship: c.relationship,
      phone: c.phone,
    })),
  };
}
