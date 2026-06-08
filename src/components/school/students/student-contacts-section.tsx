'use client';

import { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { updateStudentContactsAction } from '@/lib/school/students-actions';
import type { EmergencyContactRow } from '@/lib/db/students';
import { EMERGENCY_RELATIONSHIP_PRESETS } from '@/lib/school/students/constants';
import { useSchoolRefresh } from '@/hooks/use-school-refresh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ContactDraft = {
  fullName: string;
  relationship: string;
  phone: string;
  note: string;
};

type Props = {
  studentId: string;
  contacts: EmergencyContactRow[];
};

function toDraft(c: EmergencyContactRow): ContactDraft {
  return {
    fullName: c.full_name,
    relationship: c.relationship,
    phone: c.phone,
    note: c.note ?? '',
  };
}

export function StudentContactsSection({ studentId, contacts }: Props) {
  const { refresh } = useSchoolRefresh();
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<ContactDraft[]>(
    contacts.length > 0 ? contacts.map(toDraft) : [
        { fullName: '', relationship: 'Mère', phone: '', note: '' },
      ],
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateDraft(index: number, patch: Partial<ContactDraft>) {
    setDrafts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await updateStudentContactsAction({
      studentId,
      contacts: drafts,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
    setSuccess(result.message ?? 'Contacts enregistrés.');
    refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Contacts d&apos;urgence</CardTitle>
          <CardDescription>Responsables joignables en cas de besoin.</CardDescription>
        </div>
        {!editing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setDrafts(
                contacts.length > 0
                  ? contacts.map(toDraft)
                  : [{ fullName: '', relationship: 'Mère', phone: '', note: '' }],
              );
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" aria-hidden />
            Modifier
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && !editing && (
          <Alert>
            <AlertDescription className="flex items-center gap-1.5">
              <Check className="size-4 text-secondary" aria-hidden />
              {success}
            </AlertDescription>
          </Alert>
        )}

        {editing ? (
          <>
            {drafts.map((contact, index) => (
              <div key={index} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
                <div className="flex items-center justify-between sm:col-span-2">
                  <span className="text-sm font-medium">Contact {index + 1}</span>
                  {drafts.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setDrafts((p) => p.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label>Nom complet</Label>
                  <Input
                    value={contact.fullName}
                    onChange={(e) =>
                      updateDraft(index, { fullName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Lien</Label>
                  <select
                    value={contact.relationship}
                    onChange={(e) =>
                      updateDraft(index, { relationship: e.target.value })
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
                  >
                    {EMERGENCY_RELATIONSHIP_PRESETS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Téléphone</Label>
                  <Input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateDraft(index, { phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Note</Label>
                  <Input
                    value={contact.note}
                    onChange={(e) => updateDraft(index, { note: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() =>
                  setDrafts((p) => [
                    ...p,
                    { fullName: '', relationship: 'Mère', phone: '', note: '' },
                  ])
                }
                disabled={drafts.length >= 3}
              >
                <Plus className="size-4" aria-hidden />
                Ajouter
              </Button>
              <Button type="button" onClick={handleSave} disabled={pending}>
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={pending}
              >
                Annuler
              </Button>
            </div>
          </>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun contact enregistré.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {contacts.map((c) => (
              <li key={c.id} className="px-3 py-3 text-sm">
                <p className="font-medium">{c.full_name}</p>
                <p className="text-muted-foreground">
                  {c.relationship} · {c.phone}
                </p>
                {c.note ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
