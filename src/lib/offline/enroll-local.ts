import {
  getOfflineDb,
  type LocalClass,
  type LocalContact,
  type LocalStudent,
  type LocalStudentDetail,
} from '@/lib/offline/db';
import type {
  OutboxMutation,
  RegisterStudentContact,
  RegisterStudentPayload,
} from '@/lib/offline/outbox-types';
import {
  normalizeStudentNamePart,
  pickClassSectionForLevelFromRows,
} from '@/lib/school/students/constants';

export type EnrollLocalInput = {
  schoolId: string;
  academicYearId: string;
  level: string;
  lastName: string;
  firstName: string;
  autoMatricule: boolean;
  matricule?: string;
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
};

export type EnrollLocalResult =
  | { ok: true; studentId: string; matricule: string; pendingSync: boolean }
  | { ok: false; error: string };

function provisionalMatricule(mutationId: string): string {
  return `MAT-P-${mutationId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function cleanContacts(
  contacts: EnrollLocalInput['contacts'],
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

/** Compte les inscriptions locales en attente par classe (capacité réaliste). */
async function pendingCountByClass(
  schoolId: string,
): Promise<Map<string, number>> {
  const pending = await getOfflineDb()
    .students.where('school_id')
    .equals(schoolId)
    .filter((s) => s.sync_status === 'pending')
    .toArray();
  const map = new Map<string, number>();
  for (const s of pending) {
    if (!s.class_id) continue;
    map.set(s.class_id, (map.get(s.class_id) ?? 0) + 1);
  }
  return map;
}

function classesWithPendingCapacity(
  classes: LocalClass[],
  pendingByClass: Map<string, number>,
): LocalClass[] {
  return classes.map((c) => ({
    ...c,
    current_count: c.current_count + (pendingByClass.get(c.id) ?? 0),
  }));
}

/**
 * Inscription optimiste locale (spec : id élève = id mutation outbox).
 * Écrit dans IndexedDB + outbox ; la sync cloud suit.
 */
export async function enrollStudentLocally(
  input: EnrollLocalInput,
): Promise<EnrollLocalResult> {
  const first_name = normalizeStudentNamePart(input.firstName);
  const last_name = normalizeStudentNamePart(input.lastName);
  if (!first_name || !last_name) {
    return { ok: false, error: 'Le prénom et le nom sont obligatoires.' };
  }

  const cleaned = cleanContacts(input.contacts);
  if (cleaned.length === 0) {
    return { ok: false, error: 'Au moins un contact d’urgence est requis.' };
  }

  const db = getOfflineDb();
  const localClasses = await db.classes
    .where('school_id')
    .equals(input.schoolId)
    .toArray();

  const yearClasses = localClasses.filter(
    (c) => c.academic_year_id === input.academicYearId,
  );
  if (yearClasses.length === 0) {
    return {
      ok: false,
      error: 'Aucune classe en cache. Connectez-vous pour synchroniser.',
    };
  }

  const pendingByClass = await pendingCountByClass(input.schoolId);
  const adjusted = classesWithPendingCapacity(yearClasses, pendingByClass);
  const section = pickClassSectionForLevelFromRows(adjusted, input.level);
  if (!section) {
    return {
      ok: false,
      error: 'Toutes les sections de ce niveau sont pleines.',
    };
  }

  const mutationId = crypto.randomUUID();
  const now = new Date().toISOString();
  const matricule = input.autoMatricule
    ? provisionalMatricule(mutationId)
    : (input.matricule?.trim().toUpperCase() || null);

  if (!matricule) {
    return { ok: false, error: 'Le matricule est obligatoire.' };
  }

  const payload: RegisterStudentPayload = {
    academicYearId: input.academicYearId,
    classId: section.id,
    className: section.name,
    classLevel: section.level,
    classCycle: section.cycle,
    level: input.level,
    student: {
      first_name,
      last_name,
      matricule,
      autoMatricule: input.autoMatricule,
      birth_date: input.birthDate || null,
      lieu_naissance: input.lieuNaissance?.trim() || null,
      ecole_provenance: input.ecoleProvenance?.trim() || null,
      gender: input.gender || null,
      address: input.address?.trim() || null,
    },
    contacts: cleaned,
  };

  const mutation: OutboxMutation = {
    id: mutationId,
    school_id: input.schoolId,
    type: 'register_student',
    payload,
    created_at: now,
    attempts: 0,
    last_error: null,
    status: 'pending',
  };

  const directoryRow: LocalStudent = {
    id: mutationId,
    school_id: input.schoolId,
    first_name,
    last_name,
    matricule,
    gender: input.gender || null,
    birth_date: input.birthDate || null,
    status: 'active',
    class_id: section.id,
    class_name: section.name,
    class_level: section.level,
    class_cycle: section.cycle,
    sync_status: 'pending',
    updated_at: now,
  };

  const detailRow: LocalStudentDetail = {
    id: mutationId,
    school_id: input.schoolId,
    first_name,
    last_name,
    matricule,
    birth_date: input.birthDate || null,
    lieu_naissance: input.lieuNaissance?.trim() || null,
    ecole_provenance: input.ecoleProvenance?.trim() || null,
    gender: input.gender || null,
    photo_url: null,
    address: input.address?.trim() || null,
    status: 'active',
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  };

  const contactRows: LocalContact[] = cleaned.map((c, i) => ({
    id: `${mutationId}-contact-${i}`,
    student_id: mutationId,
    school_id: input.schoolId,
    full_name: c.full_name,
    relationship: c.relationship,
    phone: c.phone,
    note: c.note,
    created_at: now,
    sync_status: 'pending',
  }));

  await db.transaction(
    'rw',
    db.outbox,
    db.students,
    db.studentDetails,
    db.contacts,
    db.classes,
    async () => {
      await db.outbox.put(mutation);
      await db.students.put(directoryRow);
      await db.studentDetails.put(detailRow);
      await db.contacts.bulkPut(contactRows);
      // Capacité optimiste locale (réajustée au pull).
      const cls = await db.classes.get(section.id);
      if (cls) {
        await db.classes.update(section.id, {
          current_count: cls.current_count + 1,
        });
      }
    },
  );

  return {
    ok: true,
    studentId: mutationId,
    matricule,
    pendingSync: true,
  };
}
