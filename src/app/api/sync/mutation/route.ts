import { NextResponse } from 'next/server';
import { requireSchoolDirection } from '@/lib/auth/require-role';
import { getActiveAcademicYearLite } from '@/lib/db/academic-years';
import {
  replaceEmergencyContacts,
  transferStudentClass,
  updateStudent,
} from '@/lib/db/students';
import type {
  TransferClassPayload,
  UpdateContactsPayload,
  UpdateStudentPayload,
} from '@/lib/offline/outbox-types';
import type { StudentGender } from '@/lib/school/students/constants';

export const dynamic = 'force-dynamic';

type Body =
  | { type: 'update_student'; mutationId: string; payload: UpdateStudentPayload }
  | {
      type: 'update_student_contacts';
      mutationId: string;
      payload: UpdateContactsPayload;
    }
  | {
      type: 'transfer_student_class';
      mutationId: string;
      payload: TransferClassPayload;
    };

function parseGender(raw: string | null): StudentGender | null {
  if (raw === 'male' || raw === 'female' || raw === 'other') return raw;
  return null;
}

/** Pousse une mutation de mise à jour locale vers Supabase. */
export async function POST(request: Request) {
  const { schoolId } = await requireSchoolDirection();

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  if (!body?.type || !body.mutationId || !body.payload?.studentId) {
    return NextResponse.json({ error: 'Mutation incomplète.' }, { status: 400 });
  }

  try {
    switch (body.type) {
      case 'update_student': {
        const p = body.payload;
        await updateStudent(schoolId, p.studentId, {
          first_name: p.first_name,
          last_name: p.last_name,
          matricule: p.matricule,
          birth_date: p.birth_date,
          lieu_naissance: p.lieu_naissance,
          ecole_provenance: p.ecole_provenance,
          gender: parseGender(p.gender),
          address: p.address,
          status: p.status,
        });
        break;
      }
      case 'update_student_contacts': {
        await replaceEmergencyContacts(
          schoolId,
          body.payload.studentId,
          body.payload.contacts,
        );
        break;
      }
      case 'transfer_student_class': {
        const p = body.payload;
        const activeYear = await getActiveAcademicYearLite(schoolId);
        if (!activeYear || activeYear.id !== p.academicYearId) {
          return NextResponse.json(
            { error: 'Aucune année scolaire active.' },
            { status: 422 },
          );
        }
        await transferStudentClass({
          schoolId,
          studentId: p.studentId,
          academicYearId: p.academicYearId,
          newClassId: p.classId,
        });
        break;
      }
      default:
        return NextResponse.json(
          { error: 'Type de mutation inconnu.' },
          { status: 400 },
        );
    }

    return NextResponse.json({ ok: true, studentId: body.payload.studentId });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Mise à jour impossible.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
