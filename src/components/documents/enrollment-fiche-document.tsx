import type { EnrollmentFicheDocument } from '@/lib/documents/types';
import {
  formatStudentGender,
  studentFullName,
} from '@/lib/school/students/constants';
import { DocumentSchoolHeader } from '@/components/documents/document-school-header';

type Props = {
  data: EnrollmentFicheDocument;
};

function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'long' });
}

export function EnrollmentFicheDocumentView({ data }: Props) {
  const studentName = studentFullName(
    data.student.last_name,
    data.student.first_name,
  );

  return (
    <div className="document-body space-y-6 text-sm text-black">
      <DocumentSchoolHeader school={data.school} subtitle={data.academicYear} />

      <div className="text-center">
        <h2 className="text-base font-bold uppercase tracking-widest">
          Fiche d&apos;inscription
        </h2>
        <p className="mt-1 text-xs text-black/70">Année scolaire {data.academicYear}</p>
      </div>

      <section>
        <h3 className="document-section-title mb-2 text-xs font-bold uppercase tracking-wide">
          Scolarité
        </h3>
        <dl className="document-grid grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-black/50">Classe</dt>
            <dd className="font-semibold">{data.classLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/50">Date d&apos;inscription</dt>
            <dd>{formatDateFr(data.enrolledAt)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="document-section-title mb-2 text-xs font-bold uppercase tracking-wide">
          Identité de l&apos;élève
        </h3>
        <dl className="document-grid grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs text-black/50">Nom complet</dt>
            <dd className="text-base font-semibold uppercase">{studentName}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/50">Matricule</dt>
            <dd className="font-medium">{data.student.matricule ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/50">Sexe</dt>
            <dd>{formatStudentGender(data.student.gender)}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/50">Date de naissance</dt>
            <dd>{formatDateFr(data.student.birth_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/50">Lieu de naissance</dt>
            <dd>{data.student.lieu_naissance ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-black/50">École de provenance</dt>
            <dd>{data.student.ecole_provenance ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-black/50">Adresse</dt>
            <dd>{data.student.address ?? '—'}</dd>
          </div>
        </dl>
      </section>

      {data.contacts.length > 0 ? (
        <section>
          <h3 className="document-section-title mb-2 text-xs font-bold uppercase tracking-wide">
            Contacts d&apos;urgence
          </h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/20 text-left text-xs text-black/50">
                <th className="py-1.5 pr-2 font-medium">Nom</th>
                <th className="py-1.5 pr-2 font-medium">Lien</th>
                <th className="py-1.5 font-medium">Téléphone</th>
              </tr>
            </thead>
            <tbody>
              {data.contacts.map((c, i) => (
                <tr key={i} className="border-b border-black/10">
                  <td className="py-2 pr-2">{c.full_name}</td>
                  <td className="py-2 pr-2">{c.relationship}</td>
                  <td className="py-2 tabular-nums">{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <div className="document-signatures mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <div className="border-b border-black/30 pb-10" />
          <p className="mt-1 text-xs text-black/60">Signature du directeur / cachet</p>
        </div>
        <div>
          <div className="border-b border-black/30 pb-10" />
          <p className="mt-1 text-xs text-black/60">Signature du parent / tuteur</p>
        </div>
      </div>

      <p className="document-footer text-center text-xs text-black/50">
        Fiche établie le{' '}
        {new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' })} — Pema Class
      </p>
    </div>
  );
}
