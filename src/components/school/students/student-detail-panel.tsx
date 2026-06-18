'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Phone, X } from 'lucide-react';
import { WaAvatar } from '@/components/school/mobile/wa-avatar';
import { Badge } from '@/components/ui/badge';
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
  activeYearName: string | null;
  online: boolean;
  onClose: () => void;
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
  activeYearName,
  online,
  onClose,
}: Props) {
  const { detail, directory, contacts, loading } = useStudentDetail(studentId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
            aria-label="Fermer"
          >
            <ArrowLeft className="size-5 md:hidden" aria-hidden />
            <X className="hidden size-5 md:block" aria-hidden />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-lg font-medium">Fiche élève</h2>
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
                <Badge variant="secondary" className="font-normal">
                  {formatStudentStatus(detail?.status ?? directory?.status)}
                </Badge>
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
                href={`/school/eleves/${studentId}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-wa-divider bg-wa-panel px-4 py-3 text-sm font-medium text-wa-accent transition-colors hover:bg-wa-row-hover aria-disabled:pointer-events-none aria-disabled:opacity-50"
                aria-disabled={!online}
                title={
                  online
                    ? 'Modifier, caisse, impression'
                    : 'Nécessite une connexion'
                }
              >
                <ExternalLink className="size-4" aria-hidden />
                {online
                  ? 'Fiche complète (modifier, caisse, imprimer)'
                  : 'Fiche complète — connexion requise'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
