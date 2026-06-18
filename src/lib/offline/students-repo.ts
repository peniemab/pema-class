import {
  getOfflineDb,
  metaKey,
  type LocalClass,
  type LocalContact,
  type LocalStudent,
  type LocalStudentDetail,
} from '@/lib/offline/db';
import type { StudentsSnapshot } from '@/lib/offline/students-snapshot';

export type StudentsSyncState = {
  activeYear: { id: string; name: string } | null;
  stats: { total: number; enrolled: number; unassigned: number } | null;
  lastSyncAt: string | null;
};

const SCOPE_STATE = 'students:state';

/** Écrit un snapshot serveur dans IndexedDB (remplace le cache de l'école). */
export async function saveStudentsSnapshot(
  snapshot: StudentsSnapshot,
): Promise<void> {
  const db = getOfflineDb();
  const { schoolId } = snapshot;

  const students: LocalStudent[] = snapshot.students.map((s) => ({
    id: s.id,
    school_id: schoolId,
    first_name: s.first_name,
    last_name: s.last_name,
    matricule: s.matricule,
    gender: s.gender,
    birth_date: s.birth_date,
    status: s.status,
    class_id: s.class_id,
    class_name: s.class_name,
    class_level: s.class_level,
    class_cycle: s.class_cycle,
    sync_status: 'synced',
    updated_at: snapshot.generatedAt,
  }));

  const classes: LocalClass[] = snapshot.classes.map((c) => ({
    id: c.id,
    school_id: c.school_id,
    academic_year_id: c.academic_year_id,
    name: c.name,
    level: c.level,
    cycle: c.cycle,
    max_capacity: c.max_capacity,
    current_count: c.current_count,
  }));

  const details: LocalStudentDetail[] = snapshot.details.map((s) => ({
    id: s.id,
    school_id: s.school_id,
    first_name: s.first_name,
    last_name: s.last_name,
    matricule: s.matricule,
    birth_date: s.birth_date,
    lieu_naissance: s.lieu_naissance,
    ecole_provenance: s.ecole_provenance,
    gender: s.gender,
    photo_url: s.photo_url,
    address: s.address,
    status: s.status,
    created_at: s.created_at,
    updated_at: s.updated_at,
    sync_status: 'synced',
  }));

  const contacts: LocalContact[] = snapshot.contacts.map((c) => ({
    id: c.id,
    student_id: c.student_id,
    school_id: schoolId,
    full_name: c.full_name,
    relationship: c.relationship,
    phone: c.phone,
    note: c.note,
    created_at: c.created_at,
    sync_status: 'synced',
  }));

  await db.transaction(
    'rw',
    db.students,
    db.classes,
    db.studentDetails,
    db.contacts,
    db.meta,
    async () => {
      // Remplace les enregistrements « synced » de cette école (préserve
      // d'éventuels brouillons locaux des phases suivantes — pending/error).
      const staleSynced = await db.students
        .where('school_id')
        .equals(schoolId)
        .filter((s) => s.sync_status === 'synced')
        .primaryKeys();
      await db.students.bulkDelete(staleSynced);
      await db.students.bulkPut(students);

      const staleClasses = await db.classes
        .where('school_id')
        .equals(schoolId)
        .primaryKeys();
      await db.classes.bulkDelete(staleClasses);
      await db.classes.bulkPut(classes);

      const staleDetails = await db.studentDetails
        .where('school_id')
        .equals(schoolId)
        .filter((d) => d.sync_status === 'synced')
        .primaryKeys();
      await db.studentDetails.bulkDelete(staleDetails);
      await db.studentDetails.bulkPut(details);

      const staleContacts = await db.contacts
        .where('school_id')
        .equals(schoolId)
        .filter((c) => c.sync_status === 'synced')
        .primaryKeys();
      await db.contacts.bulkDelete(staleContacts);
      await db.contacts.bulkPut(contacts);

      const state: StudentsSyncState = {
        activeYear: snapshot.activeYear,
        stats: snapshot.stats,
        lastSyncAt: snapshot.generatedAt,
      };
      await db.meta.put({
        key: metaKey(schoolId, SCOPE_STATE),
        school_id: schoolId,
        scope: SCOPE_STATE,
        value: state,
        updated_at: snapshot.generatedAt,
      });
    },
  );
}

export async function readLocalStudentDetail(
  studentId: string,
): Promise<LocalStudentDetail | null> {
  const db = getOfflineDb();
  return (await db.studentDetails.get(studentId)) ?? null;
}

export async function readLocalContactsForStudent(
  studentId: string,
): Promise<LocalContact[]> {
  const db = getOfflineDb();
  return db.contacts.where('student_id').equals(studentId).toArray();
}

export async function readStudentsSyncState(
  schoolId: string,
): Promise<StudentsSyncState | null> {
  const db = getOfflineDb();
  const row = await db.meta.get(metaKey(schoolId, SCOPE_STATE));
  return (row?.value as StudentsSyncState | undefined) ?? null;
}

export async function readLocalStudents(
  schoolId: string,
): Promise<LocalStudent[]> {
  const db = getOfflineDb();
  return db.students.where('school_id').equals(schoolId).toArray();
}

export async function readLocalClasses(
  schoolId: string,
): Promise<LocalClass[]> {
  const db = getOfflineDb();
  return db.classes.where('school_id').equals(schoolId).toArray();
}
