import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import {
  countStudentsForYear,
  listEmergencyContactsForSchool,
  listStudentsDirectory,
  listStudentsFullForSchool,
  type EmergencyContactRow,
  type StudentDirectoryRow,
  type StudentRow,
} from '@/lib/db/students';

/** Instantané complet d'un établissement pour le cache hors ligne (Élèves). */
export type StudentsSnapshot = {
  schoolId: string;
  activeYear: { id: string; name: string } | null;
  students: StudentDirectoryRow[];
  /** Fiches complètes (profil détaillé) pour la lecture hors ligne. */
  details: StudentRow[];
  /** Contacts d'urgence de tous les élèves de l'école. */
  contacts: EmergencyContactRow[];
  classes: ClassRow[];
  stats: { total: number; enrolled: number; unassigned: number } | null;
  generatedAt: string;
};

/**
 * Snapshot non paginé : tous les élèves de l'année active + classes + stats.
 * Sert à remplir IndexedDB (lecture/recherche locale instantanée).
 */
export async function getStudentsSnapshot(
  schoolId: string,
): Promise<StudentsSnapshot> {
  const activeYear = await getActiveAcademicYear(schoolId);
  const generatedAt = new Date().toISOString();

  if (!activeYear) {
    const [details, contacts] = await Promise.all([
      listStudentsFullForSchool(schoolId),
      listEmergencyContactsForSchool(schoolId),
    ]);
    return {
      schoolId,
      activeYear: null,
      students: [],
      details,
      contacts,
      classes: [],
      stats: null,
      generatedAt,
    };
  }

  const [classes, directory, stats, details, contacts] = await Promise.all([
    listClassesForYear(schoolId, activeYear.id),
    // pageSize très large → on récupère tout en une page.
    listStudentsDirectory(schoolId, activeYear.id, {}, 1, 100_000),
    countStudentsForYear(schoolId, activeYear.id),
    listStudentsFullForSchool(schoolId),
    listEmergencyContactsForSchool(schoolId),
  ]);

  return {
    schoolId,
    activeYear: { id: activeYear.id, name: activeYear.name },
    students: directory.rows,
    details,
    contacts,
    classes,
    stats,
    generatedAt,
  };
}
