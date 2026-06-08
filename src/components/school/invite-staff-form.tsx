'use client';

import { useActionState } from 'react';
import { createStaffInvite } from '@/lib/school/team-actions';
import {
  INVITABLE_STAFF_ROLES,
  STAFF_ROLE_LABELS,
} from '@/lib/auth/types';
import { CopyLinkButton } from '@/components/platform/copy-link-button';
import { formatDateTime } from '@/lib/platform/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function InviteStaffForm() {
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => createStaffInvite(formData),
    null as Awaited<ReturnType<typeof createStaffInvite>> | null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inviter un collaborateur</CardTitle>
        <CardDescription>
          Lien valable 7 jours. Le rôle est fixé dans le lien — le collaborateur
          ne peut pas le modifier.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              defaultValue="enseignant"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {INVITABLE_STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {STAFF_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
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
      </CardContent>
    </Card>
  );
}
