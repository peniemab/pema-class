'use client';

import { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import {
  transferStudentClassAction,
  updateStudentAction,
} from '@/lib/school/students-actions';
import type { ClassRow } from '@/lib/db/classes';
import type { StudentEnrollmentRow, StudentRow } from '@/lib/db/students';
import {
  classDisplayLabel,
  normalizeStudentNamePart,
  formatStudentGender,
  formatStudentStatus,
  STUDENT_GENDERS,
  STUDENT_GENDER_LABELS,
  STUDENT_STATUSES,
  STUDENT_STATUS_LABELS,
  studentFullName,
  type StudentStatus,
} from '@/lib/school/students/constants';
import { useSchoolRefresh } from '@/hooks/use-school-refresh';
import { Badge } from '@/components/ui/badge';
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

type Props = {
  student: StudentRow;
  enrollment: StudentEnrollmentRow | null;
  activeYearName: string | null;
  classes: ClassRow[];
};

export function StudentProfileSections({
  student,
  enrollment,
  activeYearName,
  classes,
}: Props) {
  const { refresh } = useSchoolRefresh();
  const [editing, setEditing] = useState(false);
  const [lastName, setLastName] = useState(student.last_name);
  const [firstName, setFirstName] = useState(student.first_name);
  const [matricule, setMatricule] = useState(student.matricule ?? '');
  const [birthDate, setBirthDate] = useState(student.birth_date ?? '');
  const [lieuNaissance, setLieuNaissance] = useState(student.lieu_naissance ?? '');
  const [ecoleProvenance, setEcoleProvenance] = useState(
    student.ecole_provenance ?? '',
  );
  const [gender, setGender] = useState(student.gender ?? '');
  const [address, setAddress] = useState(student.address ?? '');
  const [status, setStatus] = useState<StudentStatus>(
    student.status === 'inactive' ? 'inactive' : 'active',
  );
  const [classId, setClassId] = useState(enrollment?.class_id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSaveProfile() {
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await updateStudentAction({
      studentId: student.id,
      lastName,
      firstName,
      matricule,
      birthDate: birthDate || undefined,
      lieuNaissance,
      ecoleProvenance,
      gender: gender || undefined,
      address,
      status,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
    setSuccess(result.message ?? 'Enregistré.');
    refresh();
  }

  async function handleTransferClass() {
    if (!classId || classId === enrollment?.class_id) return;
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await transferStudentClassAction({
      studentId: student.id,
      classId,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(result.message ?? 'Classe mise à jour.');
    refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="flex items-center gap-1.5">
            <Check className="size-4 text-secondary" aria-hidden />
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>
              {studentFullName(student.last_name, student.first_name)}
            </CardTitle>
            <CardDescription>
              Matricule : {student.matricule ?? '—'}
            </CardDescription>
          </div>
          {!editing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3.5" aria-hidden />
              Modifier
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nom et post-nom</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(normalizeStudentNamePart(e.target.value))}
                    className="uppercase"
                    placeholder="Ex. MUKENDI KABONGO"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(normalizeStudentNamePart(e.target.value))}
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Matricule</Label>
                  <Input value={matricule} onChange={(e) => setMatricule(e.target.value)} />
                </div>
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label>Date de naissance</Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lieu de naissance</Label>
                  <Input
                    value={lieuNaissance}
                    onChange={(e) => setLieuNaissance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>École de provenance</Label>
                  <Input
                    value={ecoleProvenance}
                    onChange={(e) => setEcoleProvenance(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Adresse</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={handleSaveProfile} disabled={pending}>
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
            </div>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Statut</dt>
                <dd>
                  <Badge variant="secondary" className="mt-0.5 font-normal">
                    {formatStudentStatus(student.status)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sexe</dt>
                <dd>{formatStudentGender(student.gender)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Naissance</dt>
                <dd>
                  {student.birth_date
                    ? new Date(student.birth_date).toLocaleDateString('fr-FR')
                    : '—'}
                  {student.lieu_naissance ? ` · ${student.lieu_naissance}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Provenance</dt>
                <dd>{student.ecole_provenance ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Adresse</dt>
                <dd>{student.address ?? '—'}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {activeYearName ? (
        <Card>
          <CardHeader>
            <CardTitle>Classe — {activeYearName}</CardTitle>
            <CardDescription>Affectation pour l&apos;année en cours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrollment ? (
              <p className="text-sm font-medium">
                {classDisplayLabel(enrollment.class_level, enrollment.class_name)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Non affecté cette année.</p>
            )}
            {classes.length > 0 ? (
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[12rem] flex-1 space-y-1.5">
                  <Label htmlFor="transferClass">Changer de classe</Label>
                  <select
                    id="transferClass"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none"
                  >
                    <option value="">—</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {classDisplayLabel(c.level, c.name)} ({c.current_count}/
                        {c.max_capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    pending || !classId || classId === enrollment?.class_id
                  }
                  onClick={handleTransferClass}
                >
                  Appliquer
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
