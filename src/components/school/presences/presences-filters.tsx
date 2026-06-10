'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ClassRow } from '@/lib/db/classes';
import { classDisplayLabel } from '@/lib/school/students/constants';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';

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

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="presence-date">Date</Label>
        <Input
          id="presence-date"
          type="date"
          value={selectedDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => pushParams({ date: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="presence-class">Classe</Label>
        <NativeSelect
          id="presence-class"
          value={selectedClassId ?? ''}
          onChange={(e) => pushParams({ classe: e.target.value })}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classDisplayLabel(c.level, c.name)}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
