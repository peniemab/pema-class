'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ClassRow } from '@/lib/db/classes';
import { classDisplayLabel } from '@/lib/school/students/constants';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  basePath: string;
  classes: ClassRow[];
  selectedClassId: string | null;
  selectedDate: string;
};

function shiftDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PresencesReportFilters({
  basePath,
  classes,
  selectedClassId,
  selectedDate,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = todayIsoDate();
  const yesterday = shiftDate(today, -1);

  function pushParams(next: { classe?: string; date?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.date !== undefined) {
      if (next.date) params.set('date', next.date);
      else params.delete('date');
    }
    if (next.classe !== undefined) {
      if (next.classe) params.set('classe', next.classe);
      else params.delete('classe');
    }
    const q = params.toString();
    router.push(q ? `${basePath}?${q}` : basePath);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <QuickDateButton
          label="Aujourd'hui"
          active={selectedDate === today}
          onClick={() => pushParams({ date: today })}
        />
        <QuickDateButton
          label="Hier"
          active={selectedDate === yesterday}
          onClick={() => pushParams({ date: yesterday })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="report-date">Date</Label>
          <Input
            id="report-date"
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => pushParams({ date: e.target.value })}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="report-class">Classe</Label>
          <NativeSelect
            id="report-class"
            value={selectedClassId ?? ''}
            onChange={(e) => pushParams({ classe: e.target.value })}
            className="bg-background"
          >
            <option value="">Toutes les classes</option>
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

function QuickDateButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn('h-8 rounded-full px-3 text-xs', !active && 'bg-background')}
    >
      {label}
    </Button>
  );
}
