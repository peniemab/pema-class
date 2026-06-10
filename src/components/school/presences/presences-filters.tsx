'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ClassRow } from '@/lib/db/classes';
import { classDisplayLabel } from '@/lib/school/students/constants';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
  classes: ClassRow[];
  selectedClassId: string | null;
  selectedDate: string;
  basePath: '/school/presences' | '/app/presences';
};

export function PresencesFilters({
  classes,
  selectedClassId,
  selectedDate,
  basePath,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date().toISOString().slice(0, 10);

  function pushParams(next: { classe?: string; date?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.classe !== undefined) {
      if (next.classe) params.set('classe', next.classe);
      else params.delete('classe');
    }
    if (next.date !== undefined) {
      if (next.date) params.set('date', next.date);
      else params.delete('date');
    }
    const q = params.toString();
    router.push(q ? `${basePath}?${q}` : basePath);
  }

  const fieldClass = 'h-11 bg-wa-bg text-base md:h-10 md:text-sm';

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => pushParams({ date: today })}
        className={cn(
          'type-caption h-9 rounded-full border px-4 transition-colors md:h-8',
          selectedDate === today
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-wa-divider bg-wa-bg hover:bg-wa-row-hover',
        )}
      >
        Aujourd&apos;hui
      </button>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="presence-date" className="type-label">
            Date
          </Label>
          <Input
            id="presence-date"
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => pushParams({ date: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="presence-class" className="type-label">
            Classe
          </Label>
          <NativeSelect
            id="presence-class"
            value={selectedClassId ?? ''}
            onChange={(e) => pushParams({ classe: e.target.value })}
            className={fieldClass}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {classDisplayLabel(c.level, c.name)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
    </div>
  );
}
