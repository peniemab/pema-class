import { NextResponse } from 'next/server';
import { requireSchoolDirection } from '@/lib/auth/require-role';
import { createAdminClient } from '@/lib/supabase/admin';
import { enrollStudent } from '@/lib/db/students';
import type { RegisterStudentPayload } from '@/lib/offline/outbox-types';
import type { StudentGender } from '@/lib/school/students/constants';

export const dynamic = 'force-dynamic';

type Body = {
  mutationId: string;
  payload: RegisterStudentPayload;
};

function isUniqueViolation(message: string): boolean {
  return message.includes('23505') || /duplicate|unique/i.test(message);
}

/** Pousse une inscription locale (outbox) vers Supabase. */
export async function POST(request: Request) {
  const { schoolId } = await requireSchoolDirection();

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const { mutationId, payload } = body;
  if (!mutationId || !payload?.academicYearId || !payload.classId) {
    return NextResponse.json({ error: 'Mutation incomplète.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotence : matricule provisoire déjà présent sur le serveur.
  const provMatricule = payload.student.matricule;
  if (provMatricule?.startsWith('MAT-P-')) {
    const { data: existing } = await admin
      .from('students')
      .select('id, matricule')
      .eq('school_id', schoolId)
      .eq('matricule', provMatricule)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        studentId: (existing as { id: string }).id,
        matricule: (existing as { matricule: string }).matricule,
        className: payload.className,
        classLevel: payload.classLevel,
      });
    }
  }

  const gender =
    payload.student.gender === 'male' ||
    payload.student.gender === 'female' ||
    payload.student.gender === 'other'
      ? (payload.student.gender as StudentGender)
      : null;

  try {
    const result = await enrollStudent({
      schoolId,
      academicYearId: payload.academicYearId,
      classId: payload.classId,
      student: {
        first_name: payload.student.first_name,
        last_name: payload.student.last_name,
        matricule: payload.student.autoMatricule
          ? null
          : payload.student.matricule,
        autoMatricule: payload.student.autoMatricule,
        birth_date: payload.student.birth_date,
        lieu_naissance: payload.student.lieu_naissance,
        ecole_provenance: payload.student.ecole_provenance,
        gender,
        address: payload.student.address,
      },
      contacts: payload.contacts,
    });

    return NextResponse.json({
      studentId: result.studentId,
      matricule: result.matricule,
      className: result.className,
      classLevel: result.classLevel,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Inscription impossible.';

    if (isUniqueViolation(message) && provMatricule) {
      const { data: existing } = await admin
        .from('students')
        .select('id, matricule')
        .eq('school_id', schoolId)
        .eq('matricule', provMatricule)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({
          studentId: (existing as { id: string }).id,
          matricule: (existing as { matricule: string }).matricule,
          className: payload.className,
          classLevel: payload.classLevel,
        });
      }
    }

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
