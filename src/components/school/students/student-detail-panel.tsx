'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Pencil, Phone, X } from 'lucide-react';
import { WaAvatar } from '@/components/school/mobile/wa-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StudentDetailEditForm } from '@/components/school/students/student-detail-edit-form';
import type { LocalClass } from '@/lib/offline/db';
import { useStudentDetail } from '@/lib/offline/use-student-detail';
import {
  classDisplayLabel,
  formatStudentGender,
  formatStudentStatus,
  studentFullName,
} from '@/lib/school/students/constants';
import { SCHOOL_CYCLE_LABELS, type SchoolCycle } from '@/lib/school/referentials/constants';

type Props = {
  studentId: string;
  schoolId: string;
  academicYearId: string | null;
  activeYearName: string | null;
  classes: LocalClass[];
  online: boolean;
  onClose: () => void;
  onSync: () => void;
};

function classText(level: string | null, name: string | null, cycle: string | null) {
  const base = classDisplayLabel(level, name);
  if (cycle) {
    const c = SCHOOL_CYCLE_LABELS[cycle as SchoolCycle] ?? cycle;
    return `${base} · ${c}`;
  }
  return base;
}

export function StudentDetailPanel({
  studentId,
  schoolId,
  academicYearId,
  activeYearName,
  classes,
  online,
  onClose,
  onSync,
}: Props) {
  const { detail, directory, contacts, loading } = useStudentDetail(studentId);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [studentId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editing) setEditing(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, editing]);

  const lastName = detail?.last_name ?? directory?.last_name ?? '';
  const firstName = detail?.first_name ?? directory?.first_name ?? '';
  const name = studentFullName(lastName, firstName);
  const matricule = detail?.matricule ?? directory?.matricule ?? null;
  const classLabel = classText(
    directory?.class_level ?? null,
    directory?.class_name ?? null,
    directory?.class_cycle ?? null,
  );
  const notFound = !loading && !detail && !directory;
  const isPending =
    directory?.sync_status === 'pending' || detail?.sync_status === 'pending';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={`Fiche de ${name}`}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-background shadow-xl md:border-l"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-2 bg-wa-header px-2 py-3 text-wa-header-foreground safe-top">
          <button
            type="button"
            onClick={editing ? () => setEditing(false) : onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
            aria-label={editing ? 'Retour à la fiche' : 'Fermer'}
          >
            <ArrowLeft className="size-5 md:hidden" aria-hidden />
            <X className="hidden size-5 md:block" aria-hidden />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-lg font-medium">
            {editing ? 'Modifier' : 'Fiche élève'}
          </h2>
          {!editing && !notFound && !loading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 text-wa-header-foreground hover:bg-white/10"
              onClick={() => setEditing(true)}
              aria-label="Modifier la fiche"
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-wa-text-secondary">
              Chargement…
            </p>
          ) : notFound ? (
            <p className="px-4 py-10 text-center text-sm text-wa-text-secondary">
              Fiche introuvable dans le cache local.
            </p>
          ) : editing ? (
            <StudentDetailEditForm
              schoolId={schoolId}
              studentId={studentId}
              academicYearId={academicYearId}
              activeYearName={activeYearName}
              classes={classes}
              directory={directory}
              detail={detail}
              contacts={contacts}
              online={online}
              onCancel={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                onSync();
              }}
            />
          ) : (
            <div className="space-y-5 p-4">
              <div className="flex flex-col items-center gap-3 pb-2 pt-2 text-center">
                <WaAvatar name={name} size="lg" className="size-20 text-2xl" />
                <div>
                  <p className="text-lg font-semibold">{name}</p>
                  <p className="text-sm text-wa-text-secondary">
                    {matricule ?? 'Sans matricule'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {formatStudentStatus(detail?.status ?? directory?.status)}
                  </Badge>
                  {isPending ? (
                    <Badge variant="outline" className="font-normal">
                      À synchroniser
                    </Badge>
                  ) : null}
                </div>
              </div>

              <section className="rounded-xl border border-wa-divider bg-wa-panel">
                <h3 className="border-b border-wa-divider px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-wa-text-secondary">
                  Classe {activeYearName ? `— ${activeYearName}` : ''}
                </h3>
                <p className="px-4 py-3 text-sm font-medium">
                  {directory?.class_id ? classLabel : 'Non affecté cette année'}
                </p>
              </section>

              <section className="rounded-xl border border-wa-divider bg-wa-panel">
                <h3 className="border-b border-wa-divider px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-wa-text-secondary">
                  Identité
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-sm">
                  <div>
                    <dt className="text-wa-text-secondary">Sexe</dt>
                    <dd>{formatStudentGender(detail?.gender)}</dd>
                  </div>
                  <div>
                    <dt className="text-wa-text-secondary">Naissance</dt>
                    <dd>
                      {detail?.birth_date
                        ? new Date(detail.birth_date).toLocaleDateString('fr-FR')
                        : '—'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-wa-text-secondary">Lieu de naissance</dt>
                    <dd>{detail?.lieu_naissance ?? '—'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-wa-text-secondary">École de provenance</dt>
                    <dd>{detail?.ecole_provenance ?? '—'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-wa-text-secondary">Adresse</dt>
                    <dd>{detail?.address ?? '—'}</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl border border-wa-divider bg-wa-panel">
                <h3 className="border-b border-wa-divider px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-wa-text-secondary">
                  Contacts d&apos;urgence
                </h3>
                {contacts && contacts.length > 0 ? (
                  <ul className="divide-y divide-wa-divider">
                    {contacts.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {c.full_name}
                          </p>
                          <p className="truncate text-xs text-wa-text-secondary">
                            {c.relationship} · {c.phone}
                          </p>
                          {c.note ? (
                            <p className="truncate text-xs text-wa-text-secondary">
                              {c.note}
                            </p>
                          ) : null}
                        </div>
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone.replace(/\s+/g, '')}`}
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary transition-colors hover:bg-secondary/25"
                            aria-label={`Appeler ${c.full_name}`}
                          >
                            <Phone className="size-4" aria-hidden />
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-sm text-wa-text-secondary">
                    Aucun contact enregistré.
                  </p>
                )}
              </section>

              <Link
                href={`/school/caisse/${studentId}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-wa-divider bg-wa-panel px-4 py-3 text-sm font-medium text-wa-accent transition-colors hover:bg-wa-row-hover"
              >
                <ExternalLink className="size-4" aria-hidden />
                {isPending
                  ? 'Encaisser (sync en arrière-plan)'
                  : 'Caisse et impression'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
