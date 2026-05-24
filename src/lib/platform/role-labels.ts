import type { StaffRole } from '@/lib/auth/types';

const labels: Partial<Record<StaffRole, string>> = {
  school_admin: 'Directeur',
  admin: 'Adjoint direction',
  enseignant: 'Enseignant',
  secretaire: 'Secrétariat',
  comptabilite: 'Comptabilité',
};

export function staffRoleLabel(role: StaffRole): string {
  return labels[role] ?? role;
}
