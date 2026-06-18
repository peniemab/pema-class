import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import {
  countStudentsForYear,
  listStudentsDirectory,
  type StudentDirectoryRow,
} from '@/lib/db/students';

/** Instantané complet d'un établissement pour le cache hors ligne (Élèves). */
export type StudentsSnapshot = {
  schoolId: string;
  activeYear: { id: string; name: string } | null;
  students: StudentDirectoryRow[];
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
    return {
      schoolId,
      activeYear: null,
      students: [],
      classes: [],
      stats: null,
      generatedAt,
    };
  }

  const [classes, directory, stats] = await Promise.all([
    listClassesForYear(schoolId, activeYear.id),
    // pageSize très large → on récupère tout en une page.
    listStudentsDirectory(schoolId, activeYear.id, {}, 1, 100_000),
    countStudentsForYear(schoolId, activeYear.id),
  ]);

  return {
    schoolId,
    activeYear: { id: activeYear.id, name: activeYear.name },
    students: directory.rows,
    classes,
    stats,
    generatedAt,
  };
}
