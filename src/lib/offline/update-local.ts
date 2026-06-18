import {
  getOfflineDb,
  type LocalClass,
  type LocalContact,
} from '@/lib/offline/db';
import {
  findPendingMutation,
  replaceOrAddMutation,
} from '@/lib/offline/outbox-repo';
import type {
  OutboxMutation,
  RegisterStudentContact,
  RegisterStudentMutation,
  TransferClassPayload,
  UpdateContactsPayload,
  UpdateStudentPayload,
} from '@/lib/offline/outbox-types';
import { normalizeStudentNamePart } from '@/lib/school/students/constants';

export type LocalActionResult =
  | { ok: true; pendingSync: boolean }
  | { ok: false; error: string };

function cleanContacts(
  contacts: {
    fullName: string;
    relationship: string;
    phone: string;
    note?: string;
  }[],
): RegisterStudentContact[] {
  return contacts
    .map((c) => ({
      full_name: c.fullName.trim(),
      relationship: c.relationship.trim() || 'Autre',
      phone: c.phone.trim(),
      note: c.note?.trim() || null,
    }))
    .filter((c) => c.full_name && c.phone);
}

async function getPendingEnroll(
  schoolId: string,
  studentId: string,
): Promise<RegisterStudentMutation | undefined> {
  const m = await findPendingMutation(schoolId, studentId, 'register_student');
  if (m?.type === 'register_student') return m;
  return undefined;
}

function newMutation<T extends OutboxMutation['type']>(
  schoolId: string,
  entityId: string,
  type: T,
  payload: Extract<OutboxMutation, { type: T }>['payload'],
): OutboxMutation {
  return {
    id: crypto.randomUUID(),
    school_id: schoolId,
    entity_id: entityId,
    type,
    payload,
    created_at: new Date().toISOString(),
    attempts: 0,
    last_error: null,
    status: 'pending',
  } as OutboxMutation;
}

async function pendingCountByClass(
  schoolId: string,
  excludeStudentId?: string,
): Promise<Map<string, number>> {
  const pending = await getOfflineDb()
    .students.where('school_id')
    .equals(schoolId)
    .filter(
      (s) => s.sync_status === 'pending' && s.id !== excludeStudentId,
    )
    .toArray();
  const map = new Map<string, number>();
  for (const s of pending) {
    if (!s.class_id) continue;
    map.set(s.class_id, (map.get(s.class_id) ?? 0) + 1);
  }
  return map;
}

function classHasCapacity(
  cls: LocalClass,
  pendingByClass: Map<string, number>,
): boolean {
  const extra = pendingByClass.get(cls.id) ?? 0;
  return cls.current_count + extra < cls.max_capacity;
}

/** Met à jour le profil élève localement (+ outbox ou brouillon d'inscription). */
export async function updateStudentLocally(input: {
  schoolId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  matricule?: string;
  birthDate?: string;
  lieuNaissance?: string;
  ecoleProvenance?: string;
  gender?: string;
  address?: string;
  status: 'active' | 'inactive';
}): Promise<LocalActionResult> {
  const first_name = normalizeStudentNamePart(input.firstName);
  const last_name = normalizeStudentNamePart(input.lastName);
  if (!first_name || !last_name) {
    return { ok: false, error: 'Le prénom et le nom sont obligatoires.' };
  }

  const db = getOfflineDb();
  const directory = await db.students.get(input.studentId);
  const detail = await db.studentDetails.get(input.studentId);
  if (!directory && !detail) {
    return { ok: false, error: 'Élève introuvable dans le cache local.' };
  }

  const now = new Date().toISOString();
  const matricule =
    input.matricule?.trim().toUpperCase() ||
    detail?.matricule ||
    directory?.matricule ||
    null;

  const pendingEnroll = await getPendingEnroll(input.schoolId, input.studentId);

  if (pendingEnroll) {
    const updatedMutation: RegisterStudentMutation = {
      ...pendingEnroll,
      payload: {
        ...pendingEnroll.payload,
        student: {
          ...pendingEnroll.payload.student,
          first_name,
          last_name,
          matricule: pendingEnroll.payload.student.autoMatricule
            ? pendingEnroll.payload.student.matricule
            : matricule,
          birth_date: input.birthDate || null,
          lieu_naissance: input.lieuNaissance?.trim() || null,
          ecole_provenance: input.ecoleProvenance?.trim() || null,
          gender: input.gender || null,
          address: input.address?.trim() || null,
        },
      },
    };

    await db.transaction(
      'rw',
      db.outbox,
      db.students,
      db.studentDetails,
      async () => {
        await db.outbox.put(updatedMutation);
        if (directory) {
          await db.students.put({
            ...directory,
            first_name,
            last_name,
            matricule: updatedMutation.payload.student.matricule,
            gender: input.gender || null,
            birth_date: input.birthDate || null,
            status: input.status,
            sync_status: 'pending',
            updated_at: now,
          });
        }
        if (detail) {
          await db.studentDetails.put({
            ...detail,
            first_name,
            last_name,
            matricule: updatedMutation.payload.student.matricule,
            birth_date: input.birthDate || null,
            lieu_naissance: input.lieuNaissance?.trim() || null,
            ecole_provenance: input.ecoleProvenance?.trim() || null,
            gender: input.gender || null,
            address: input.address?.trim() || null,
            status: input.status,
            sync_status: 'pending',
            updated_at: now,
          });
        }
      },
    );
    return { ok: true, pendingSync: true };
  }

  const payload: UpdateStudentPayload = {
    studentId: input.studentId,
    first_name,
    last_name,
    matricule,
    birth_date: input.birthDate || null,
    lieu_naissance: input.lieuNaissance?.trim() || null,
    ecole_provenance: input.ecoleProvenance?.trim() || null,
    gender: input.gender || null,
    address: input.address?.trim() || null,
    status: input.status,
  };

  const mutation = newMutation(
    input.schoolId,
    input.studentId,
    'update_student',
    payload,
  );

  await db.transaction(
    'rw',
    db.outbox,
    db.students,
    db.studentDetails,
    async () => {
      await replaceOrAddMutation(mutation);
      if (directory) {
        await db.students.put({
          ...directory,
          first_name,
          last_name,
          matricule,
          gender: input.gender || null,
          birth_date: input.birthDate || null,
          status: input.status,
          sync_status: 'pending',
          updated_at: now,
        });
      }
      if (detail) {
        await db.studentDetails.put({
          ...detail,
          first_name,
          last_name,
          matricule,
          birth_date: input.birthDate || null,
          lieu_naissance: input.lieuNaissance?.trim() || null,
          ecole_provenance: input.ecoleProvenance?.trim() || null,
          gender: input.gender || null,
          address: input.address?.trim() || null,
          status: input.status,
          sync_status: 'pending',
          updated_at: now,
        });
      }
    },
  );

  return { ok: true, pendingSync: true };
}

/** Met à jour les contacts d'urgence localement. */
export async function updateContactsLocally(input: {
  schoolId: string;
  studentId: string;
  contacts: {
    fullName: string;
    relationship: string;
    phone: string;
    note?: string;
  }[];
}): Promise<LocalActionResult> {
  const cleaned = cleanContacts(input.contacts);
  if (cleaned.length === 0) {
    return { ok: false, error: 'Au moins un contact d’urgence est requis.' };
  }

  const db = getOfflineDb();
  const directory = await db.students.get(input.studentId);
  const detail = await db.studentDetails.get(input.studentId);
  if (!directory && !detail) {
    return { ok: false, error: 'Élève introuvable dans le cache local.' };
  }

  const now = new Date().toISOString();
  const pendingEnroll = await getPendingEnroll(input.schoolId, input.studentId);

  const contactRows: LocalContact[] = cleaned.map((c, i) => ({
    id: `${input.studentId}-contact-${i}`,
    student_id: input.studentId,
    school_id: input.schoolId,
    full_name: c.full_name,
    relationship: c.relationship,
    phone: c.phone,
    note: c.note,
    created_at: now,
    sync_status: 'pending' as const,
  }));

  if (pendingEnroll) {
    const updatedMutation: RegisterStudentMutation = {
      ...pendingEnroll,
      payload: { ...pendingEnroll.payload, contacts: cleaned },
    };

    await db.transaction('rw', db.outbox, db.contacts, async () => {
      await db.outbox.put(updatedMutation);
      const oldIds = await db.contacts
        .where('student_id')
        .equals(input.studentId)
        .primaryKeys();
      await db.contacts.bulkDelete(oldIds);
      await db.contacts.bulkPut(contactRows);
    });
    return { ok: true, pendingSync: true };
  }

  const payload: UpdateContactsPayload = {
    studentId: input.studentId,
    contacts: cleaned,
  };
  const mutation = newMutation(
    input.schoolId,
    input.studentId,
    'update_student_contacts',
    payload,
  );

  await db.transaction('rw', db.outbox, db.contacts, async () => {
    await replaceOrAddMutation(mutation);
    const oldIds = await db.contacts
      .where('student_id')
      .equals(input.studentId)
      .primaryKeys();
    await db.contacts.bulkDelete(oldIds);
    await db.contacts.bulkPut(contactRows);
    if (directory) {
      await db.students.update(input.studentId, {
        sync_status: 'pending',
        updated_at: now,
      });
    }
    if (detail) {
      await db.studentDetails.update(input.studentId, {
        sync_status: 'pending',
        updated_at: now,
      });
    }
  });

  return { ok: true, pendingSync: true };
}

/** Transfère un élève vers une autre classe (année active). */
export async function transferClassLocally(input: {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  classId: string;
}): Promise<LocalActionResult> {
  const db = getOfflineDb();
  const directory = await db.students.get(input.studentId);
  if (!directory) {
    return { ok: false, error: 'Élève introuvable dans le cache local.' };
  }

  if (directory.class_id === input.classId) {
    return { ok: true, pendingSync: false };
  }

  const targetClass = await db.classes.get(input.classId);
  if (!targetClass || targetClass.school_id !== input.schoolId) {
    return { ok: false, error: 'Classe introuvable dans le cache local.' };
  }
  if (targetClass.academic_year_id !== input.academicYearId) {
    return {
      ok: false,
      error: 'Cette classe n’appartient pas à l’année active.',
    };
  }

  const pendingByClass = await pendingCountByClass(
    input.schoolId,
    input.studentId,
  );
  if (!classHasCapacity(targetClass, pendingByClass)) {
    return {
      ok: false,
      error: `La classe ${targetClass.level} ${targetClass.name} est pleine.`,
    };
  }

  const now = new Date().toISOString();
  const previousClassId = directory.class_id;
  const pendingEnroll = await getPendingEnroll(input.schoolId, input.studentId);

  if (pendingEnroll) {
    const updatedMutation: RegisterStudentMutation = {
      ...pendingEnroll,
      payload: {
        ...pendingEnroll.payload,
        classId: targetClass.id,
        className: targetClass.name,
        classLevel: targetClass.level,
        classCycle: targetClass.cycle,
        level: targetClass.level,
      },
    };

    await db.transaction(
      'rw',
      db.outbox,
      db.students,
      db.classes,
      async () => {
        await db.outbox.put(updatedMutation);
        await db.students.put({
          ...directory,
          class_id: targetClass.id,
          class_name: targetClass.name,
          class_level: targetClass.level,
          class_cycle: targetClass.cycle,
          sync_status: 'pending',
          updated_at: now,
        });
        if (previousClassId && previousClassId !== targetClass.id) {
          const prev = await db.classes.get(previousClassId);
          if (prev) {
            await db.classes.update(previousClassId, {
              current_count: Math.max(0, prev.current_count - 1),
            });
          }
        }
        const next = await db.classes.get(targetClass.id);
        if (next) {
          await db.classes.update(targetClass.id, {
            current_count: next.current_count + 1,
          });
        }
      },
    );
    return { ok: true, pendingSync: true };
  }

  const payload: TransferClassPayload = {
    studentId: input.studentId,
    academicYearId: input.academicYearId,
    classId: targetClass.id,
    className: targetClass.name,
    classLevel: targetClass.level,
    classCycle: targetClass.cycle,
    previousClassId,
  };
  const mutation = newMutation(
    input.schoolId,
    input.studentId,
    'transfer_student_class',
    payload,
  );

  await db.transaction(
    'rw',
    db.outbox,
    db.students,
    db.classes,
    async () => {
      await replaceOrAddMutation(mutation);
      await db.students.put({
        ...directory,
        class_id: targetClass.id,
        class_name: targetClass.name,
        class_level: targetClass.level,
        class_cycle: targetClass.cycle,
        sync_status: 'pending',
        updated_at: now,
      });
      if (previousClassId && previousClassId !== targetClass.id) {
        const prev = await db.classes.get(previousClassId);
        if (prev) {
          await db.classes.update(previousClassId, {
            current_count: Math.max(0, prev.current_count - 1),
          });
        }
      }
      const next = await db.classes.get(targetClass.id);
      if (next) {
        await db.classes.update(targetClass.id, {
          current_count: next.current_count + 1,
        });
      }
    },
  );

  return { ok: true, pendingSync: true };
}
