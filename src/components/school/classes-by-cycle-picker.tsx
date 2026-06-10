'use client';

import type { ClassRow } from '@/lib/db/classes';
import type { SchoolCycle } from '@/lib/school/referentials/constants';
import { groupClassesByOfferedCycles } from '@/lib/school/team-grouping';
import { classDisplayLabel } from '@/lib/school/students/constants';
import { SettingsGroupLabel } from '@/components/school/settings-panel';
import { cn } from '@/lib/utils';

type Props = {
  classes: ClassRow[];
  offeredCycles: SchoolCycle[];
  selected: Set<string>;
  onToggle: (classId: string) => void;
  showEnrollmentCount?: boolean;
};

export function ClassesByCyclePicker({
  classes,
  offeredCycles,
  selected,
  onToggle,
  showEnrollmentCount = false,
}: Props) {
  const { splitByCycle, groups } = groupClassesByOfferedCycles(classes, offeredCycles);

  return (
    <div className={cn('max-h-72 space-y-4 overflow-y-auto', !splitByCycle && 'space-y-0')}>
      {groups.map((group) => (
        <div key={group.id} className="space-y-1">
          {splitByCycle && group.label ? (
            <SettingsGroupLabel>{group.label}</SettingsGroupLabel>
          ) : null}
          <div className="overflow-hidden rounded-xl border divide-y">
            {group.classes.map((c) => {
              const checked = selected.has(c.id);
              return (
                <label
                  key={c.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40',
                    checked && 'bg-primary/5',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(c.id)}
                    className="size-4 rounded border-input accent-primary"
                  />
                  <span className="flex-1 text-sm">
                    {classDisplayLabel(c.level, c.name)}
                  </span>
                  {showEnrollmentCount ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {c.current_count} élève{c.current_count > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
