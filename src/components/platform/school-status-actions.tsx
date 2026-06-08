'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { SchoolStatus } from '@/lib/auth/types';
import { setSchoolStatusAction } from '@/lib/platform/actions';
import { Button } from '@/components/ui/button';

type SchoolStatusActionsProps = {
  schoolId: string;
  status: SchoolStatus;
  compact?: boolean;
};

export function SchoolStatusActions({
  schoolId,
  status,
  compact,
}: SchoolStatusActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(next: SchoolStatus) {
    startTransition(async () => {
      const result = await setSchoolStatusAction(schoolId, next);
      if (result.ok) {
        router.refresh();
      } else {
        window.alert(result.error);
      }
    });
  }

  if (status === 'suspended') {
    return (
      <Button
        type="button"
        size={compact ? 'sm' : 'default'}
        variant="outline"
        disabled={pending}
        onClick={() => run('active')}
      >
        Réactiver
      </Button>
    );
  }

  if (status === 'active') {
    return (
      <Button
        type="button"
        size={compact ? 'sm' : 'default'}
        variant="destructive"
        disabled={pending}
        onClick={() => run('suspended')}
      >
        Suspendre
      </Button>
    );
  }

  return null;
}
