'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CloudOff, Plus, Trash2 } from 'lucide-react';
import type { LocalClass } from '@/lib/offline/db';
import { enrollStudentLocally } from '@/lib/offline/enroll-local';
import { pushOutbox } from '@/lib/offline/push-outbox';
import { getMutationServerId } from '@/lib/offline/outbox-repo';
import {
  classDisplayLabel,
  EMERGENCY_RELATIONSHIP_PRESETS,
  normalizeStudentNamePart,
  pickClassSectionForLevelFromRows,
  sectionAvailabilityLabel,
  STUDENT_GENDERS,
  STUDENT_GENDER_LABELS,
  uniqueClassLevels,
} from '@/lib/school/students/constants';
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
  schoolId: string;
  academicYearId: string;
  activeYearName: string;
  classes: LocalClass[];
  online: boolean;
};

const emptyContact = (): ContactDraft => ({
  fullName: '',
  relationship: 'Mère',
  phone: '',
  note: '',
});

export function OfflineEnrollStudentForm({
  schoolId,
  academicYearId,
  activeYearName,
  classes,
  online,
}: Props) {
  const router = useRouter();
  const levels = useMemo(
    () => uniqueClassLevels(classes.map((c) => c.level)),
    [classes],
  );
  const [level, setLevel] = useState(levels[0] ?? '');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [autoMatricule, setAutoMatricule] = useState(true);
  const [matricule, setMatricule] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [lieuNaissance, setLieuNaissance] = useState('');
  const [ecoleProvenance, setEcoleProvenance] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [contacts, setContacts] = useState<ContactDraft[]>([emptyContact()]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const assignedSection = level
    ? pickClassSectionForLevelFromRows(classes, level)
    : null;

  const sectionsForLevel = level
    ? classes.filter((c) => c.level === level)
    : [];

  function updateContact(index: number, patch: Partial<ContactDraft>) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!level) {
      setError('Sélectionnez un niveau.');
      return;
    }
    if (!assignedSection) {
      setError('Toutes les sections de ce niveau sont pleines.');
      return;
    }

    setPending(true);
    const result = await enrollStudentLocally({
      schoolId,
      academicYearId,
      level,
      lastName,
      firstName,
      autoMatricule,
      matricule: autoMatricule ? undefined : matricule,
      birthDate: birthDate || undefined,
      lieuNaissance: lieuNaissance || undefined,
      ecoleProvenance: ecoleProvenance || undefined,
      gender: gender || undefined,
      address: address || undefined,
      contacts,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (online) {
      setPending(true);
      try {
        const { pushed, failed } = await pushOutbox(schoolId);
        const serverId = await getMutationServerId(result.studentId);
        if (pushed > 0 && serverId) {
          router.push(`/school/caisse/${serverId}?nouveau=1`);
          return;
        }
        if (failed > 0) {
          setSuccess(
            `Élève enregistré localement (${result.matricule}). La synchronisation reprendra automatiquement.`,
          );
        } else {
          setSuccess(`Élève inscrit (${result.matricule}).`);
        }
        router.push('/school/eleves');
        return;
      } catch {
        setSuccess(
          `Élève enregistré localement (${result.matricule}). La synchronisation reprendra automatiquement.`,
        );
        router.push('/school/eleves');
        return;
      } finally {
        setPending(false);
      }
    }

    setSuccess(
      `Élève enregistré hors ligne (${result.matricule}). Synchronisation à la reconnexion.`,
    );
    router.push(`/school/caisse/${result.studentId}?nouveau=1`);
  }

  if (classes.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          {!online ? (
            <>
              <CloudOff className="mr-1 inline size-4" aria-hidden />
              Aucune classe en cache. Reconnectez-vous pour synchroniser les
              référentiels.
            </>
          ) : (
            <>
              Créez d&apos;abord des classes dans les{' '}
              <a
                href="/school/parametres#referentiels"
                className="font-medium text-primary underline"
              >
                référentiels
              </a>{' '}
              pour {activeYearName}.
            </>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!online ? (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <CloudOff className="size-4 shrink-0" aria-hidden />
            Mode hors ligne — l&apos;inscription sera synchronisée au retour du
            réseau (matricule provisoire MAT-P-…).
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Scolarité</CardTitle>
          <CardDescription>
            Affectation pour l&apos;année {activeYearName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="level">Niveau</Label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              {levels.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
          </div>
          {level ? (
            <div className="rounded-lg border bg-muted/20 px-3 py-2.5 text-sm">
              <p className="font-medium">Section attribuée automatiquement</p>
              {assignedSection ? (
                <p className="mt-1 text-muted-foreground">
                  {classDisplayLabel(
                    assignedSection.level,
                    assignedSection.name,
                  )}{' '}
                  ({assignedSection.current_count}/{assignedSection.max_capacity}
                  ) — première section disponible.
                </p>
              ) : (
                <p className="mt-1 text-destructive">
                  Toutes les sections sont pleines :{' '}
                  {sectionsForLevel
                    .map((c) =>
                      sectionAvailabilityLabel(
                        c.name,
                        c.current_count,
                        c.max_capacity,
                      ),
                    )
                    .join(', ')}
                </p>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identité de l&apos;élève</CardTitle>
          <CardDescription>
            Nom et post-nom en majuscules.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="lastName">Nom et post-nom *</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) =>
                setLastName(normalizeStudentNamePart(e.target.value))
              }
              className="uppercase"
              placeholder="Ex. MUKENDI KABONGO"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) =>
                setFirstName(normalizeStudentNamePart(e.target.value))
              }
              className="uppercase"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoMatricule}
                onChange={(e) => setAutoMatricule(e.target.checked)}
                className="size-4 accent-primary"
              />
              Matricule automatique
              {!online ? ' (provisoire MAT-P-… hors ligne)' : ''}
            </label>
            {!autoMatricule ? (
              <Input
                value={matricule}
                onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                placeholder="Ex. LYCEE1-0042"
                className="uppercase"
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Sexe</Label>
            <select
              id="gender"
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
            <Label htmlFor="birthDate">Date de naissance</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
            <Input
              id="lieuNaissance"
              value={lieuNaissance}
              onChange={(e) => setLieuNaissance(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ecoleProvenance">École de provenance</Label>
            <Input
              id="ecoleProvenance"
              value={ecoleProvenance}
              onChange={(e) => setEcoleProvenance(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Contacts d&apos;urgence</CardTitle>
            <CardDescription>Au moins un responsable joignable.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setContacts((p) => [...p, emptyContact()])}
            disabled={contacts.length >= 3}
          >
            <Plus className="size-4" aria-hidden />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2"
            >
              <div className="flex items-center justify-between sm:col-span-2">
                <span className="text-sm font-medium">Contact {index + 1}</span>
                {contacts.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setContacts((p) => p.filter((_, i) => i !== index))
                    }
                    aria-label="Supprimer le contact"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Nom complet *</Label>
                <Input
                  value={contact.fullName}
                  onChange={(e) =>
                    updateContact(index, { fullName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Lien de parenté</Label>
                <select
                  value={contact.relationship}
                  onChange={(e) =>
                    updateContact(index, { relationship: e.target.value })
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
                <Label>Téléphone *</Label>
                <Input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) =>
                    updateContact(index, { phone: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Input
                  value={contact.note}
                  onChange={(e) =>
                    updateContact(index, { note: e.target.value })
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={pending || !assignedSection}
        className="gap-2"
      >
        <Check className="size-4" aria-hidden />
        {pending ? 'Inscription…' : 'Inscrire l’élève'}
      </Button>
    </form>
  );
}
