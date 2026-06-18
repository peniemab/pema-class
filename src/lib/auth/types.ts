export type SchoolStatus = 'active' | 'suspended' | 'archived';

export type StaffStatus = 'active' | 'inactive' | 'suspended';

export const STAFF_ROLES = [
  'superadmin',
  'school_admin',
  'admin',
  'enseignant',
  'secretaire',
  'comptabilite',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type AuthPrincipal =
  | { kind: 'superadmin'; userId: string }
  | {
      kind: 'staff';
      userId: string;
      staffId: string;
      schoolId: string;
      role: StaffRole;
      email: string | null;
    };

const LEGACY_ROLE_MAP: Record<string, StaffRole> = {
  director: 'school_admin',
  teacher: 'enseignant',
  other: 'enseignant',
};

export function normalizeStaffRole(raw: string): StaffRole {
  if ((STAFF_ROLES as readonly string[]).includes(raw)) {
    return raw as StaffRole;
  }
  return LEGACY_ROLE_MAP[raw] ?? 'enseignant';
}

export function getRoleHomePath(role: StaffRole | 'superadmin'): string {
  switch (role) {
    case 'superadmin':
      return '/platform';
    case 'school_admin':
    case 'admin':
      return '/school';
    default:
      return '/app';
  }
}

export const SCHOOL_DIRECTION_ROLES: StaffRole[] = ['school_admin', 'admin'];

/**
 * Secrétariat + comptabilité : même périmètre en phase 1.
 * Le directeur pourra différencier les tâches plus tard.
 */
export const OFFICE_STAFF_ROLES: StaffRole[] = ['secretaire', 'comptabilite'];

/** Présences dans toutes les salles (couverture si un enseignant est absent). */
export const ATTENDANCE_ALL_CLASSES_ROLES: StaffRole[] = [
  ...SCHOOL_DIRECTION_ROLES,
  ...OFFICE_STAFF_ROLES,
];

/** Rôles autorisés à encaisser les frais. */
export const FINANCE_ROLES: StaffRole[] = [
  ...SCHOOL_DIRECTION_ROLES,
  ...OFFICE_STAFF_ROLES,
];

/** Rôles autorisés à marquer les présences élèves. */
export const ATTENDANCE_ROLES: StaffRole[] = [
  ...ATTENDANCE_ALL_CLASSES_ROLES,
  'enseignant',
];

/** Rôles autorisés à consulter les rapports (personnel sur /app). */
export const REPORT_ROLES: StaffRole[] = [
  ...SCHOOL_DIRECTION_ROLES,
  ...OFFICE_STAFF_ROLES,
];

/** Inscription et annuaire élèves (direction + bureau). */
export const ENROLLMENT_ROLES: StaffRole[] = [
  ...SCHOOL_DIRECTION_ROLES,
  ...OFFICE_STAFF_ROLES,
];

export function isOfficeStaffRole(role: StaffRole | string): boolean {
  return OFFICE_STAFF_ROLES.includes(normalizeStaffRole(role));
}

export function canMarkAllClassAttendances(role: StaffRole | string): boolean {
  return ATTENDANCE_ALL_CLASSES_ROLES.includes(normalizeStaffRole(role));
}

/** Rôles invitables par la direction (Paramètres → Équipe) — pas le directeur. */
export const INVITABLE_STAFF_ROLES = [
  'admin',
  'enseignant',
  'secretaire',
  'comptabilite',
] as const;

export type InvitableStaffRole = (typeof INVITABLE_STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  superadmin: 'Super administrateur',
  school_admin: 'Directeur / propriétaire',
  admin: 'Adjoint direction',
  enseignant: 'Enseignant',
  secretaire: 'Secrétariat',
  comptabilite: 'Comptabilité',
};

export function staffRoleLabel(role: string): string {
  const normalized = normalizeStaffRole(role);
  return STAFF_ROLE_LABELS[normalized] ?? role;
}
