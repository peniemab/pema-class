'use client';

import { useActionState, useState } from 'react';
import { createStaffInvite } from '@/lib/school/team-actions';
import {
  INVITABLE_STAFF_ROLES,
  STAFF_ROLE_LABELS,
} from '@/lib/auth/types';
import type { ClassRow } from '@/lib/db/classes';
import type { SchoolCycle } from '@/lib/school/referentials/constants';
import { ClassesByCyclePicker } from '@/components/school/classes-by-cycle-picker';
import { CopyLinkButton } from '@/components/platform/copy-link-button';
import { formatDateTime } from '@/lib/platform/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type InviteStaffFormProps = {
  embedded?: boolean;
  classes: ClassRow[];
  activeYearName: string | null;
  offeredCycles: SchoolCycle[];
};

export function InviteStaffForm({
  embedded = false,
  classes,
  activeYearName,
  offeredCycles,
}: InviteStaffFormProps) {
  const [role, setRole] = useState('enseignant');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
    () => new Set(),
  );
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => createStaffInvite(formData),
    null as Awaited<ReturnType<typeof createStaffInvite>> | null,
  );

  const showClassPicker = role === 'enseignant';

  function toggleClass(classId: string) {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  }

  const form = (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail du collaborateur</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Rôle dans l&apos;établissement</Label>
        <select
          id="role"
          name="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {INVITABLE_STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {STAFF_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {showClassPicker ? (
        <div className="space-y-2">
          <Label>Classes assignées</Label>
          {!activeYearName ? (
            <Alert>
              <AlertDescription>
                Activez une année scolaire pour pré-assigner des classes à
                l&apos;enseignant.
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
            <ClassesByCyclePicker
              classes={classes}
              offeredCycles={offeredCycles}
              selected={selectedClasses}
              onToggle={toggleClass}
            />
          )}
          {Array.from(selectedClasses).map((classId) => (
            <input key={classId} type="hidden" name="classIds" value={classId} />
          ))}
          <p className="text-xs text-muted-foreground">
            Optionnel — vous pourrez aussi assigner les classes après
            l&apos;inscription.
          </p>
        </div>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Génération…' : 'Générer le lien d\'invitation'}
      </Button>
      {state?.ok === false && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.ok === true && (
        <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
          <p className="font-medium">Lien à transmettre</p>
          <p className="mt-1 break-all font-mono text-xs">{state.inviteUrl}</p>
          <p className="mt-2 text-muted-foreground">
            Expire le {formatDateTime(state.expiresAt)}
          </p>
          <div className="mt-3">
            <CopyLinkButton url={state.inviteUrl} variant="secondary" />
          </div>
        </div>
      )}
    </form>
  );

  if (embedded) {
    return <div className="px-1">{form}</div>;
  }

  return form;
}
