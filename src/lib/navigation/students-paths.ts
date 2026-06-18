export const SCHOOL_STUDENTS_BASE = '/school/eleves';
export const APP_STUDENTS_BASE = '/app/eleves';

export function studentsPath(base: string, ...segments: string[]): string {
  const path = [base, ...segments].filter(Boolean).join('/');
  return path.replace(/\/+/g, '/');
}

export function studentsCaisseBase(studentsBase: string): string {
  return studentsBase.replace(/\/eleves\/?$/, '/caisse');
}
