'use client';

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
  onClassChange: (classId: string) => void;
  onDateChange: (date: string) => void;
};

/** Filtres présences en état local — aucune navigation Next.js. */
export function PresencesFiltersLocal({
  classes,
  selectedClassId,
  selectedDate,
  onClassChange,
  onDateChange,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const fieldClass = 'h-11 bg-wa-bg text-base md:h-10 md:text-sm';

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onDateChange(today)}
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
          <Label htmlFor="presence-date-local" className="type-label">
            Date
          </Label>
          <Input
            id="presence-date-local"
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => onDateChange(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="presence-class-local" className="type-label">
            Classe
          </Label>
          <NativeSelect
            id="presence-class-local"
            value={selectedClassId ?? ''}
            onChange={(e) => onClassChange(e.target.value)}
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
