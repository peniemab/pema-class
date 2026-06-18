'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LocalClass, LocalContact, LocalStudent, LocalStudentDetail } from '@/lib/offline/db';
import { pushOutbox } from '@/lib/offline/push-outbox';
import {
  transferClassLocally,
  updateContactsLocally,
  updateStudentLocally,
} from '@/lib/offline/update-local';
import {
  classDisplayLabel,
  EMERGENCY_RELATIONSHIP_PRESETS,
  normalizeStudentNamePart,
  STUDENT_GENDERS,
  STUDENT_GENDER_LABELS,
  STUDENT_STATUSES,
  STUDENT_STATUS_LABELS,
  type StudentStatus,
} from '@/lib/school/students/constants';

type ContactDraft = {
  fullName: string;
  relationship: string;
  phone: string;
  note: string;
};

type Props = {
  schoolId: string;
  studentId: string;
  academicYearId: string | null;
  activeYearName: string | null;
  classes: LocalClass[];
  directory: LocalStudent | null | undefined;
  detail: LocalStudentDetail | null | undefined;
  contacts: LocalContact[] | undefined;
  online: boolean;
  onCancel: () => void;
  onSaved: () => void;
};

function toContactDraft(c: LocalContact): ContactDraft {
  return {
    fullName: c.full_name,
    relationship: c.relationship,
    phone: c.phone,
    note: c.note ?? '',
  };
}

export function StudentDetailEditForm({
  schoolId,
  studentId,
  academicYearId,
  activeYearName,
  classes,
  directory,
  detail,
  contacts,
  online,
  onCancel,
  onSaved,
}: Props) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [matricule, setMatricule] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [lieuNaissance, setLieuNaissance] = useState('');
  const [ecoleProvenance, setEcoleProvenance] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<StudentStatus>('active');
  const [classId, setClassId] = useState('');
  const [drafts, setDrafts] = useState<ContactDraft[]>([
    { fullName: '', relationship: 'Mère', phone: '', note: '' },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const matriculeLocked = useMemo(
    () => matricule.startsWith('MAT-P-'),
    [matricule],
  );

  const yearClasses = useMemo(
    () =>
      academicYearId
        ? classes.filter((c) => c.academic_year_id === academicYearId)
        : [],
    [classes, academicYearId],
  );

  useEffect(() => {
    setLastName(detail?.last_name ?? directory?.last_name ?? '');
    setFirstName(detail?.first_name ?? directory?.first_name ?? '');
    setMatricule(detail?.matricule ?? directory?.matricule ?? '');
    setBirthDate(detail?.birth_date ?? directory?.birth_date ?? '');
    setLieuNaissance(detail?.lieu_naissance ?? '');
    setEcoleProvenance(detail?.ecole_provenance ?? '');
    setGender(detail?.gender ?? directory?.gender ?? '');
    setAddress(detail?.address ?? '');
    setStatus(
      (detail?.status ?? directory?.status) === 'inactive'
        ? 'inactive'
        : 'active',
    );
    setClassId(directory?.class_id ?? '');
    setDrafts(
      contacts && contacts.length > 0
        ? contacts.map(toContactDraft)
        : [{ fullName: '', relationship: 'Mère', phone: '', note: '' }],
    );
  }, [detail, directory, contacts, studentId]);

  function updateDraft(index: number, patch: Partial<ContactDraft>) {
    setDrafts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setPending(true);

    const profileResult = await updateStudentLocally({
      schoolId,
      studentId,
      lastName,
      firstName,
      matricule: matriculeLocked ? undefined : matricule,
      birthDate: birthDate || undefined,
      lieuNaissance,
      ecoleProvenance,
      gender: gender || undefined,
      address,
      status,
    });
    if (!profileResult.ok) {
      setPending(false);
      setError(profileResult.error);
      return;
    }

    const contactsResult = await updateContactsLocally({
      schoolId,
      studentId,
      contacts: drafts,
    });
    if (!contactsResult.ok) {
      setPending(false);
      setError(contactsResult.error);
      return;
    }

    if (
      academicYearId &&
      classId &&
      classId !== (directory?.class_id ?? '')
    ) {
      const transferResult = await transferClassLocally({
        schoolId,
        studentId,
        academicYearId,
        classId,
      });
      if (!transferResult.ok) {
        setPending(false);
        setError(transferResult.error);
        return;
      }
    }

    if (online) {
      try {
        await pushOutbox(schoolId);
      } catch {
        // Enregistrement local OK ; sync au prochain cycle.
      }
    }

    setPending(false);
    setSuccess(
      online
        ? 'Modifications enregistrées.'
        : 'Enregistré localement — synchronisation à la reconnexion.',
    );
    onSaved();
  }

  return (
    <div className="space-y-5 p-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription className="flex items-center gap-1.5">
            <Check className="size-4 text-secondary" aria-hidden />
            {success}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-xl border border-wa-divider bg-wa-panel">
        <h3 className="border-b border-wa-divider px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-wa-text-secondary">
          Identité
        </h3>
        <div className="space-y-3 px-4 py-3">
          <div className="space-y-1.5">
            <Label>Nom et post-nom</Label>
            <Input
              value={lastName}
              onChange={(e) =>
                setLastName(normalizeStudentNamePart(e.target.value))
              }
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Prénom</Label>
            <Input
              value={firstName}
              onChange={(e) =>
                setFirstName(normalizeStudentNamePart(e.target.value))
              }
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Matricule</Label>
            <Input
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              disabled={matriculeLocked}
            />
            {matriculeLocked ? (
              <p className="text-xs text-wa-text-secondary">
                Matricule provisoire — définitif après synchronisation.
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StudentStatus)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
              >
                {STUDENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STUDENT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Sexe</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
              >
                <option value="">—</option>
                {STUDENT_GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {STUDENT_GENDER_LABELS[g]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Date de naissance</Label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Lieu de naissance</Label>
            <Input
              value={lieuNaissance}
              onChange={(e) => setLieuNaissance(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>École de provenance</Label>
            <Input
              value={ecoleProvenance}
              onChange={(e) => setEcoleProvenance(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
      </section>

      {activeYearName && yearClasses.length > 0 ? (
        <section className="rounded-xl border border-wa-divider bg-wa-panel">
          <h3 className="border-b border-wa-divider px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-wa-text-secondary">
            Classe — {activeYearName}
          </h3>
          <div className="space-y-2 px-4 py-3">
            <Label htmlFor="offlineTransferClass">Affectation</Label>
            <select
              id="offlineTransferClass"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
            >
              {yearClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {classDisplayLabel(c.level, c.name)} ({c.current_count}/
                  {c.max_capacity})
                </option>
              ))}
            </select>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-wa-divider bg-wa-panel">
        <h3 className="border-b border-wa-divider px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-wa-text-secondary">
          Contacts d&apos;urgence
        </h3>
        <div className="space-y-4 px-4 py-3">
          {drafts.map((c, index) => (
            <div
              key={index}
              className="space-y-2 rounded-lg border border-wa-divider/60 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-wa-text-secondary">
                  Contact {index + 1}
                </span>
                {drafts.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() =>
                      setDrafts((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label="Supprimer le contact"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
              <Input
                placeholder="Nom complet"
                value={c.fullName}
                onChange={(e) => updateDraft(index, { fullName: e.target.value })}
              />
              <select
                value={c.relationship}
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
                <option value="Autre">Autre</option>
              </select>
              <Input
                placeholder="Téléphone"
                value={c.phone}
                onChange={(e) => updateDraft(index, { phone: e.target.value })}
                inputMode="tel"
              />
              <Input
                placeholder="Note (optionnel)"
                value={c.note}
                onChange={(e) => updateDraft(index, { note: e.target.value })}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              setDrafts((prev) => [
                ...prev,
                { fullName: '', relationship: 'Mère', phone: '', note: '' },
              ])
            }
          >
            <Plus className="size-4" aria-hidden />
            Ajouter un contact
          </Button>
        </div>
      </section>

      <div className="flex gap-2 pb-4">
        <Button type="button" onClick={handleSave} disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}
