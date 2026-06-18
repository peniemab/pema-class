import type { LocalStudent } from '@/lib/offline/db';
import type { StudentDirectoryRow } from '@/lib/db/students';

export type LocalStudentsFilters = {
  search?: string;
  classId?: string;
  status?: 'active' | 'inactive' | 'all';
  unassignedOnly?: boolean;
};

/** Recherche tolérante (nom, prénom, matricule, classe) — miroir du serveur. */
function matchesSearch(row: LocalStudent, term: string): boolean {
  const tokens = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = [
    row.first_name,
    row.last_name,
    row.matricule ?? '',
    row.class_level ?? '',
    row.class_name ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const matriculeNorm = (row.matricule ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  return tokens.every((token) => {
    if (haystack.includes(token)) return true;
    const tokenNorm = token.replace(/[^a-z0-9]/g, '');
    return tokenNorm.length >= 2 && matriculeNorm.includes(tokenNorm);
  });
}

export function filterLocalStudents(
  students: LocalStudent[],
  filters: LocalStudentsFilters,
): LocalStudent[] {
  let rows = students;

  const search = filters.search?.trim().toLowerCase() ?? '';
  if (search) rows = rows.filter((r) => matchesSearch(r, search));
  if (filters.classId) rows = rows.filter((r) => r.class_id === filters.classId);
  if (filters.unassignedOnly) rows = rows.filter((r) => !r.class_id);
  if (filters.status && filters.status !== 'all') {
    rows = rows.filter((r) => r.status === filters.status);
  }

  return [...rows].sort((a, b) => {
    const ln = a.last_name.localeCompare(b.last_name, 'fr');
    return ln !== 0 ? ln : a.first_name.localeCompare(b.first_name, 'fr');
  });
}

/** Convertit le format local vers le format attendu par StudentsTable. */
export function toDirectoryRow(s: LocalStudent): StudentDirectoryRow {
  return {
    id: s.id,
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
  };
}
