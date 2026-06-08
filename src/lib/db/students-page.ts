import { cache } from 'react';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import {
  countStudentsForYear,
  getStudentById,
  getStudentEnrollmentForYear,
  listEmergencyContacts,
  listStudentsDirectory,
  type EmergencyContactRow,
  type StudentEnrollmentRow,
  type StudentRow,
  type StudentsDirectoryFilters,
  type StudentsDirectoryResult,
} from '@/lib/db/students';
import { resolveStudentsPageSize } from '@/lib/school/students/constants';

export type StudentsListPageData = {
  activeYear: { id: string; name: string } | null;
  directory: StudentsDirectoryResult | null;
  stats: { total: number; enrolled: number; unassigned: number } | null;
  classes: ClassRow[];
  filters: StudentsDirectoryFilters & { page: number };
};

export type StudentDetailPageData = {
  activeYear: { id: string; name: string } | null;
  student: StudentRow;
  enrollment: StudentEnrollmentRow | null;
  contacts: EmergencyContactRow[];
  classes: ClassRow[];
};

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

async function fetchStudentsListPageData(
  schoolId: string,
  searchParams: Record<string, string | undefined>,
): Promise<StudentsListPageData> {
  const activeYear = await getActiveAcademicYear(schoolId);
  const filters: StudentsDirectoryFilters & { page: number } = {
    search: searchParams.q?.trim() || undefined,
    classId: searchParams.classe || undefined,
    status:
      searchParams.statut === 'inactive'
        ? 'inactive'
        : searchParams.statut === 'active'
          ? 'active'
          : 'all',
    unassignedOnly: searchParams.sans_classe === '1',
    page: parsePage(searchParams.page),
  };

  if (!activeYear) {
    return {
      activeYear: null,
      directory: null,
      stats: null,
      classes: [],
      filters,
    };
  }

  const classes = await listClassesForYear(schoolId, activeYear.id);
  const filterClass = filters.classId
    ? classes.find((c) => c.id === filters.classId)
    : null;
  const pageSize = resolveStudentsPageSize(filterClass?.max_capacity ?? null);

  const [directory, stats] = await Promise.all([
    listStudentsDirectory(
      schoolId,
      activeYear.id,
      filters,
      filters.page,
      pageSize,
    ),
    countStudentsForYear(schoolId, activeYear.id),
  ]);

  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    directory,
    stats,
    classes,
    filters,
  };
}

async function fetchStudentDetailPageData(
  schoolId: string,
  studentId: string,
): Promise<StudentDetailPageData | null> {
  const [student, activeYear] = await Promise.all([
    getStudentById(schoolId, studentId),
    getActiveAcademicYear(schoolId),
  ]);
  if (!student) return null;

  const [enrollment, contacts, classes] = await Promise.all([
    activeYear
      ? getStudentEnrollmentForYear(schoolId, studentId, activeYear.id)
      : Promise.resolve(null),
    listEmergencyContacts(studentId),
    activeYear
      ? listClassesForYear(schoolId, activeYear.id)
      : Promise.resolve([]),
  ]);

  return {
    activeYear: activeYear
      ? { id: activeYear.id, name: activeYear.name }
      : null,
    student,
    enrollment,
    contacts,
    classes,
  };
}

export const getStudentsListPageData = cache(fetchStudentsListPageData);
export const getStudentDetailPageData = cache(fetchStudentDetailPageData);

export type EnrollStudentPageData = {
  activeYear: { id: string; name: string };
  classes: ClassRow[];
};

async function fetchEnrollStudentPageData(
  schoolId: string,
): Promise<EnrollStudentPageData | null> {
  const activeYear = await getActiveAcademicYear(schoolId);
  if (!activeYear) return null;
  const classes = await listClassesForYear(schoolId, activeYear.id);
  return {
    activeYear: { id: activeYear.id, name: activeYear.name },
    classes,
  };
}

export const getEnrollStudentPageData = cache(fetchEnrollStudentPageData);
