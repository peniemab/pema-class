export const STUDENT_STATUSES = ['active', 'inactive'] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STUDENT_GENDERS = ['male', 'female', 'other'] as const;

export type StudentGender = (typeof STUDENT_GENDERS)[number];

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
};

export const STUDENT_GENDER_LABELS: Record<StudentGender, string> = {
  male: 'Masculin',
  female: 'Féminin',
  other: 'Autre',
};

export const EMERGENCY_RELATIONSHIP_PRESETS = [
  'Père',
  'Mère',
  'Tuteur',
  'Tutrice',
  'Oncle',
  'Tante',
  'Autre',
] as const;

/** Pagination par défaut (une salle type 30 places). */
export const STUDENTS_PAGE_SIZE_DEFAULT = 30;

/** Plafond pagination (grandes sections). */
export const STUDENTS_PAGE_SIZE_MAX = 100;

/** Normalise identité — majuscules pour registres, reçus, bulletins. */
export function normalizeStudentNamePart(value: string): string {
  return value.trim().toUpperCase();
}

export function studentFullName(lastName: string, firstName: string): string {
  const nom = normalizeStudentNamePart(lastName);
  const prenom = normalizeStudentNamePart(firstName);
  return `${nom} ${prenom}`.trim();
}

export function resolveStudentsPageSize(classMaxCapacity: number | null): number {
  if (classMaxCapacity == null || classMaxCapacity <= 0) {
    return STUDENTS_PAGE_SIZE_DEFAULT;
  }
  return Math.min(classMaxCapacity, STUDENTS_PAGE_SIZE_MAX);
}

export function uniqueClassLevels(levels: readonly string[]): string[] {
  return [...new Set(levels)].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function pickClassSectionForLevelFromRows<
  T extends { level: string; name: string; current_count: number; max_capacity: number },
>(classes: readonly T[], level: string): T | null {
  return (
    classes
      .filter((c) => c.level === level && c.current_count < c.max_capacity)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))[0] ?? null
  );
}

export function formatStudentGender(raw: string | null | undefined): string {
  if (raw === 'male') return STUDENT_GENDER_LABELS.male;
  if (raw === 'female') return STUDENT_GENDER_LABELS.female;
  if (raw === 'other') return STUDENT_GENDER_LABELS.other;
  return '—';
}

export function formatStudentStatus(raw: string | null | undefined): string {
  if (raw === 'inactive') return STUDENT_STATUS_LABELS.inactive;
  return STUDENT_STATUS_LABELS.active;
}

export function classDisplayLabel(
  level: string | null | undefined,
  name: string | null | undefined,
): string {
  if (!level && !name) return '—';
  if (!name) return level ?? '—';
  return `${level} ${name}`.trim();
}

export function sectionAvailabilityLabel(
  sectionName: string,
  current: number,
  max: number,
): string {
  return `${sectionName} (${current}/${max})`;
}
