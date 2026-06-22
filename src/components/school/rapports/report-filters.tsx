'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ClassRow } from '@/lib/db/classes';
import { classDisplayLabel } from '@/lib/school/students/constants';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ClassFilterProps = {
  basePath: string;
  classes: ClassRow[];
  selectedClassId: string | null;
  onClassChange?: (classId: string | null) => void;
};

export function ReportClassFilter({
  basePath,
  classes,
  selectedClassId,
  onClassChange,
}: ClassFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function pushClass(classId: string) {
    if (onClassChange) {
      onClassChange(classId || null);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (classId) params.set('classe', classId);
    else params.delete('classe');
    const q = params.toString();
    router.push(q ? `${basePath}?${q}` : basePath);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="report-class">Classe</Label>
      <NativeSelect
        id="report-class"
        value={selectedClassId ?? ''}
        onChange={(e) => pushClass(e.target.value)}
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
  );
}

export function ReportPeriodToggle({
  basePath,
  periodDays,
  options,
  onPeriodChange,
}: {
  basePath: string;
  periodDays: number;
  options: { value: number; label: string }[];
  onPeriodChange?: (days: number) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function pushPeriod(value: number) {
    if (onPeriodChange) {
      onPeriodChange(value);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('periode', String(value));
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant={periodDays === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => pushPeriod(opt.value)}
          className={cn(
            'h-8 rounded-full px-3 text-xs',
            periodDays !== opt.value && 'bg-background',
          )}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
