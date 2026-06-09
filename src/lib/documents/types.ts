import type { SchoolRow } from '@/lib/db/schools';

export type SchoolDocumentInfo = {
  name: string;
  displayName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
};

export type PaymentReceiptDocument = {
  school: SchoolDocumentInfo;
  payment: {
    id: string;
    receipt_number: string;
    amount_paid: number;
    currency: string;
    created_at: string;
  };
  fee: {
    name: string;
    academic_year: string;
    amount_due: number;
    total_paid_before: number;
    total_paid_after: number;
    amount_remaining: number;
  };
  student: {
    last_name: string;
    first_name: string;
    matricule: string | null;
  };
  classLabel: string | null;
};

export type EnrollmentFicheDocument = {
  school: SchoolDocumentInfo;
  academicYear: string;
  student: {
    last_name: string;
    first_name: string;
    matricule: string | null;
    birth_date: string | null;
    lieu_naissance: string | null;
    ecole_provenance: string | null;
    gender: string | null;
    address: string | null;
  };
  classLabel: string;
  enrolledAt: string | null;
  contacts: {
    full_name: string;
    relationship: string;
    phone: string;
  }[];
};

export function toSchoolDocumentInfo(school: SchoolRow): SchoolDocumentInfo {
  return {
    name: school.name,
    displayName: school.display_name ?? school.name,
    address: school.address,
    phone: school.phone,
    email: school.email,
    logoUrl: school.logo_url,
  };
}
