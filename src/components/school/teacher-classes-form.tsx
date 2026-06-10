'use client';

import { useActionState, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { ClassRow } from '@/lib/db/classes';
import type { TeamStaffRow } from '@/lib/db/team-page';
import type { SchoolCycle } from '@/lib/school/referentials/constants';
import { saveTeacherClassesAction } from '@/lib/school/team-actions';
import { ClassesByCyclePicker } from '@/components/school/classes-by-cycle-picker';
import { staffRoleLabel } from '@/lib/auth/types';
import { staffDisplayName } from '@/lib/platform/format';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  member: TeamStaffRow;
  classes: ClassRow[];
  activeYearName: string | null;
  offeredCycles: SchoolCycle[];
};

export function TeacherClassesForm({
  member,
  classes,
  activeYearName,
  offeredCycles,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(member.classIds),
  );
  const [state, action, pending] = useActionState(
    saveTeacherClassesAction,
    null as Awaited<ReturnType<typeof saveTeacherClassesAction>> | null,
  );

  function toggle(classId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  }

  const isTeacher = member.role === 'enseignant';

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-muted/20 px-4 py-3">
        <p className="font-medium">{staffDisplayName(member)}</p>
        <p className="text-sm text-muted-foreground">
          {staffRoleLabel(member.role)}
          {member.email ? ` · ${member.email}` : ''}
        </p>
      </div>

      {!isTeacher ? (
        <Alert>
          <AlertDescription>
            L&apos;affectation de classes concerne uniquement les enseignants.
          </AlertDescription>
        </Alert>
      ) : !activeYearName ? (
        <Alert>
          <AlertDescription>
            Activez une année scolaire dans Référentiels pour assigner des
            classes.
          </AlertDescription>
        </Alert>
      ) : classes.length === 0 ? (
        <Alert>
          <AlertDescription>
            Aucune classe pour {activeYearName}. Créez des classes dans
            Référentiels.
          </AlertDescription>
        </Alert>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="staffId" value={member.id} />
          <div>
            <p className="mb-3 text-sm font-medium">
              Classes — {activeYearName}
            </p>
            <ClassesByCyclePicker
              classes={classes}
              offeredCycles={offeredCycles}
              selected={selected}
              onToggle={toggle}
              showEnrollmentCount
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Ces classes apparaîtront dans Présences pour cet enseignant.
            </p>
          </div>

          {Array.from(selected).map((classId) => (
            <input key={classId} type="hidden" name="classIds" value={classId} />
          ))}

          <Button type="submit" disabled={pending} className="w-full gap-1.5">
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            Enregistrer les classes
          </Button>

          {state?.ok === false ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state?.ok === true ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Classes enregistrées.
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
