import type { ClassRow } from '@/lib/db/classes';
import type { TeamStaffRow } from '@/lib/db/team-page';
import { staffRoleLabel } from '@/lib/auth/types';
import {
  CYCLE_DISPLAY_ORDER,
  levelToCycle,
  SCHOOL_CYCLE_LABELS,
  type SchoolCycle,
} from '@/lib/school/referentials/constants';

export type PersonnelSection = {
  id: string;
  label: string;
  kind: 'cycle' | 'unassigned' | 'administration' | 'enseignants';
  members: TeamStaffRow[];
};

function sortMembers(members: TeamStaffRow[]): TeamStaffRow[] {
  return [...members].sort((a, b) =>
    `${a.last_name} ${a.first_name}`.localeCompare(
      `${b.last_name} ${b.first_name}`,
      'fr',
    ),
  );
}

function classCycle(cls: ClassRow): SchoolCycle {
  if (cls.cycle && (CYCLE_DISPLAY_ORDER as readonly string[]).includes(cls.cycle)) {
    return cls.cycle as SchoolCycle;
  }
  return levelToCycle(cls.level);
}

export function buildPersonnelSections(
  staff: TeamStaffRow[],
  classes: ClassRow[],
  offeredCycles: SchoolCycle[],
): PersonnelSection[] {
  const cycles = CYCLE_DISPLAY_ORDER.filter((cycle) => offeredCycles.includes(cycle));
  const splitByCycle = cycles.length > 1;
  const classById = new Map(classes.map((c) => [c.id, c]));

  const others = sortMembers(staff.filter((member) => member.role !== 'enseignant'));
  const teachers = staff.filter((member) => member.role === 'enseignant');

  const sections: PersonnelSection[] = [];

  if (others.length > 0) {
    sections.push({
      id: 'administration',
      label: 'Administration',
      kind: 'administration',
      members: others,
    });
  }

  if (!splitByCycle) {
    if (teachers.length > 0) {
      sections.push({
        id: 'enseignants',
        label: 'Enseignants',
        kind: 'enseignants',
        members: sortMembers(teachers),
      });
    }
    return sections;
  }

  const unassigned: TeamStaffRow[] = [];
  const byCycle = new Map<SchoolCycle, TeamStaffRow[]>();
  for (const cycle of cycles) {
    byCycle.set(cycle, []);
  }

  for (const teacher of teachers) {
    const teacherCycles = new Set<SchoolCycle>();
    for (const classId of teacher.classIds) {
      const cls = classById.get(classId);
      if (cls) teacherCycles.add(classCycle(cls));
    }

    if (teacherCycles.size === 0) {
      unassigned.push(teacher);
      continue;
    }

    for (const cycle of teacherCycles) {
      const bucket = byCycle.get(cycle);
      if (bucket) bucket.push(teacher);
    }
  }

  for (const cycle of cycles) {
    const members = sortMembers(byCycle.get(cycle) ?? []);
    if (members.length === 0) continue;
    sections.push({
      id: cycle,
      label: SCHOOL_CYCLE_LABELS[cycle],
      kind: 'cycle',
      members,
    });
  }

  if (unassigned.length > 0) {
    sections.push({
      id: 'unassigned',
      label: 'Sans classe assignée',
      kind: 'unassigned',
      members: sortMembers(unassigned),
    });
  }

  return sections;
}

function sortClasses(classes: ClassRow[]): ClassRow[] {
  return [...classes].sort((a, b) => {
    const levelCmp = a.level.localeCompare(b.level, 'fr');
    if (levelCmp !== 0) return levelCmp;
    return a.name.localeCompare(b.name, 'fr');
  });
}

export type ClassCycleGroup = {
  id: string;
  label: string;
  classes: ClassRow[];
};

export function groupClassesByOfferedCycles(
  classes: ClassRow[],
  offeredCycles: SchoolCycle[],
): { splitByCycle: boolean; groups: ClassCycleGroup[] } {
  const cycles = CYCLE_DISPLAY_ORDER.filter((cycle) => offeredCycles.includes(cycle));
  const splitByCycle = cycles.length > 1;

  if (!splitByCycle) {
    return {
      splitByCycle: false,
      groups: [{ id: 'all', label: '', classes: sortClasses(classes) }],
    };
  }

  const groups = cycles
    .map((cycle) => ({
      id: cycle,
      label: SCHOOL_CYCLE_LABELS[cycle],
      classes: sortClasses(classes.filter((cls) => classCycle(cls) === cycle)),
    }))
    .filter((group) => group.classes.length > 0);

  return { splitByCycle: true, groups };
}

export function memberDetail(member: TeamStaffRow): string {
  if (member.role === 'enseignant') {
    const count = member.classIds.length;
    if (count === 0) return 'Aucune classe';
    return `${count} classe${count > 1 ? 's' : ''}`;
  }
  return staffRoleLabel(member.role);
}
