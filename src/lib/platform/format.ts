import type { SchoolStatus } from '@/lib/auth/types';

export type OnboardingLinkStatus = 'pending' | 'used' | 'expired';

export function getOnboardingLinkStatus(input: {
  used_at: string | null;
  expires_at: string;
}): OnboardingLinkStatus {
  if (input.used_at) {
    return 'used';
  }
  if (new Date(input.expires_at) < new Date()) {
    return 'expired';
  }
  return 'pending';
}

export function onboardingStatusLabel(status: OnboardingLinkStatus): string {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'used':
      return 'Utilisé';
    case 'expired':
      return 'Expiré';
  }
}

export function schoolStatusLabel(status: SchoolStatus): string {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'suspended':
      return 'Suspendu';
    case 'archived':
      return 'Archivé';
  }
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function staffDisplayName(input: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}): string {
  const parts = [input.first_name, input.last_name].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return input.email ?? '—';
}
