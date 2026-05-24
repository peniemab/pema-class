import type { SchoolStatus } from '@/lib/auth/types';
import {
  getOnboardingLinkStatus,
  onboardingStatusLabel,
  schoolStatusLabel,
  type OnboardingLinkStatus,
} from '@/lib/platform/format';
import { cn } from '@/lib/utils';

const schoolTone: Record<SchoolStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  suspended: 'bg-red-500/15 text-red-800 dark:text-red-200',
  archived: 'bg-muted text-muted-foreground',
};

const onboardingTone: Record<OnboardingLinkStatus, string> = {
  pending: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
  used: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  expired: 'bg-muted text-muted-foreground',
};

export function SchoolStatusBadge({ status }: { status: SchoolStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        schoolTone[status],
      )}
    >
      {schoolStatusLabel(status)}
    </span>
  );
}

export function OnboardingStatusBadge(input: {
  used_at: string | null;
  expires_at: string;
}) {
  const status = getOnboardingLinkStatus(input);
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        onboardingTone[status],
      )}
    >
      {onboardingStatusLabel(status)}
    </span>
  );
}
