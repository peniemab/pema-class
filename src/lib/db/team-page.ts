import { cache } from 'react';
import { getActiveAcademicYear } from '@/lib/db/academic-years';
import { listClassesForYear, type ClassRow } from '@/lib/db/classes';
import { listStaffForSchool, type StaffRow } from '@/lib/db/staff';
import { listTeacherClassIdsForStaff } from '@/lib/db/teacher-classes';
import { normalizeStaffRole, type StaffRole } from '@/lib/auth/types';

export type TeamStaffRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  role: StaffRole;
  is_active: boolean;
  status: string;
  classIds: string[];
};

export type TeamPageData = {
  activeYear: { id: string; name: string } | null;
  classes: ClassRow[];
  staff: TeamStaffRow[];
};

async function fetchTeamPageData(schoolId: string): Promise<TeamPageData> {
  const [activeYear, staffRows] = await Promise.all([
    getActiveAcademicYear(schoolId),
    listStaffForSchool(schoolId),
  ]);

  const classes = activeYear
    ? await listClassesForYear(schoolId, activeYear.id)
    : [];

  const teacherIds = staffRows
    .filter((s) => normalizeStaffRole(s.role) === 'enseignant')
    .map((s) => s.id);

  const classIdsByStaff = activeYear
    ? await listTeacherClassIdsForStaff(teacherIds, activeYear.id)
    : new Map<string, string[]>();

  const staff: TeamStaffRow[] = staffRows.map((row) => ({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    role: normalizeStaffRole(row.role),
    is_active: row.is_active,
    status: row.status,
    classIds: classIdsByStaff.get(row.id) ?? [],
  }));

  staff.sort((a, b) => {
    const roleOrder = (role: StaffRole) => {
      if (role === 'school_admin') return 0;
      if (role === 'admin') return 1;
      return 2;
    };
    const diff = roleOrder(a.role) - roleOrder(b.role);
    if (diff !== 0) return diff;
    return `${a.last_name} ${a.first_name}`.localeCompare(
      `${b.last_name} ${b.first_name}`,
      'fr',
    );
  });

  return {
    activeYear: activeYear
      ? { id: activeYear.id, name: activeYear.name }
      : null,
    classes,
    staff,
  };
}

export const getTeamPageData = cache(fetchTeamPageData);
