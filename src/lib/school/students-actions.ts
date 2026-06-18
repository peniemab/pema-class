'use server';

import { revalidatePath } from 'next/cache';
import { requireSchoolEnrollment } from '@/lib/auth/require-role';
import {
  APP_STUDENTS_BASE,
  SCHOOL_STUDENTS_BASE,
} from '@/lib/navigation/students-paths';
import { getActiveAcademicYearLite } from '@/lib/db/academic-years';
import {
  enrollStudent,
  replaceEmergencyContacts,
  suggestStudents,
  transferStudentClass,
  updateStudent,
} from '@/lib/db/students';
import {
  getEnrollStudentPageData,
  getStudentDetailPageData,
  getStudentsListPageData,
} from '@/lib/db/students-page';
import type { StudentGender, StudentStatus } from '@/lib/school/students/constants';

export type ActionResult =
  | { ok: true; message?: string; studentId?: string }
  | { ok: false; error: string };

function revalidateStudents(studentId?: string) {
  for (const base of [SCHOOL_STUDENTS_BASE, APP_STUDENTS_BASE]) {
    revalidatePath(base);
    if (studentId) {
      revalidatePath(`${base}/${studentId}`);
    }
  }
  revalidatePath('/school');
  revalidatePath('/app');
}

export async function loadStudentsListPage(
  searchParams: Record<string, string | undefined>,
) {
  const { schoolId } = await requireSchoolEnrollment();
  return getStudentsListPageData(schoolId, searchParams);
}

export async function loadStudentDetailPage(studentId: string) {
  const { schoolId } = await requireSchoolEnrollment();
  return getStudentDetailPageData(schoolId, studentId);
}

export async function loadEnrollStudentPage() {
  const { schoolId } = await requireSchoolEnrollment();
  return getEnrollStudentPageData(schoolId);
}

export async function suggestStudentsAction(term: string) {
  const { schoolId } = await requireSchoolEnrollment();
  const activeYear = await getActiveAcademicYearLite(schoolId);
  if (!activeYear) return [];
  return suggestStudents(schoolId, activeYear.id, term);
}

export async function enrollStudentAction(input: {
  level: string;
  lastName: string;
  firstName: string;
  matricule?: string;
  autoMatricule: boolean;
  birthDate?: string;
  lieuNaissance?: string;
  ecoleProvenance?: string;
  gender?: string;
  address?: string;
  contacts: {
    fullName: string;
    relationship: string;
    phone: string;
    note?: string;
  }[];
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolEnrollment();
    const activeYear = await getActiveAcademicYearLite(schoolId);
    if (!activeYear) {
      return {
        ok: false,
        error: 'Créez et activez une année scolaire avant d’inscrire un élève.',
      };
    }

    const gender =
      input.gender === 'male' || input.gender === 'female' || input.gender === 'other'
        ? (input.gender as StudentGender)
        : null;

    const { studentId, classLevel, className } = await enrollStudent({
      schoolId,
      academicYearId: activeYear.id,
      level: input.level,
      student: {
        last_name: input.lastName,
        first_name: input.firstName,
        matricule: input.autoMatricule ? null : input.matricule?.trim() || null,
        autoMatricule: input.autoMatricule,
        birth_date: input.birthDate || null,
        lieu_naissance: input.lieuNaissance,
        ecole_provenance: input.ecoleProvenance,
        gender,
        address: input.address,
      },
      contacts: input.contacts.map((c) => ({
        full_name: c.fullName,
        relationship: c.relationship,
        phone: c.phone,
        note: c.note,
      })),
    });

    revalidateStudents(studentId);
    return {
      ok: true,
      message: `Élève inscrit en ${classLevel} ${className}.`,
      studentId,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Inscription impossible.',
    };
  }
}

export async function updateStudentAction(input: {
  studentId: string;
  firstName: string;
  lastName: string;
  matricule?: string;
  birthDate?: string;
  lieuNaissance?: string;
  ecoleProvenance?: string;
  gender?: string;
  address?: string;
  status: StudentStatus;
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolEnrollment();
    const gender =
      input.gender === 'male' || input.gender === 'female' || input.gender === 'other'
        ? (input.gender as StudentGender)
        : null;

    await updateStudent(schoolId, input.studentId, {
      first_name: input.firstName,
      last_name: input.lastName,
      matricule: input.matricule?.trim() || null,
      birth_date: input.birthDate || null,
      lieu_naissance: input.lieuNaissance,
      ecole_provenance: input.ecoleProvenance,
      gender,
      address: input.address,
      status: input.status,
    });

    revalidateStudents(input.studentId);
    return { ok: true, message: 'Fiche élève mise à jour.' };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Mise à jour impossible.',
    };
  }
}

export async function updateStudentContactsAction(input: {
  studentId: string;
  contacts: {
    fullName: string;
    relationship: string;
    phone: string;
    note?: string;
  }[];
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolEnrollment();
    await replaceEmergencyContacts(
      schoolId,
      input.studentId,
      input.contacts.map((c) => ({
        full_name: c.fullName,
        relationship: c.relationship,
        phone: c.phone,
        note: c.note,
      })),
    );
    revalidateStudents(input.studentId);
    return { ok: true, message: 'Contacts mis à jour.' };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Mise à jour impossible.',
    };
  }
}

export async function transferStudentClassAction(input: {
  studentId: string;
  classId: string;
}): Promise<ActionResult> {
  try {
    const { schoolId } = await requireSchoolEnrollment();
    const activeYear = await getActiveAcademicYearLite(schoolId);
    if (!activeYear) {
      return { ok: false, error: 'Aucune année scolaire active.' };
    }

    await transferStudentClass({
      schoolId,
      studentId: input.studentId,
      academicYearId: activeYear.id,
      newClassId: input.classId,
    });

    revalidateStudents(input.studentId);
    return { ok: true, message: 'Classe mise à jour.' };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Changement de classe impossible.',
    };
  }
}
