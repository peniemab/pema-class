import type { PaymentReceiptDocument } from '@/lib/documents/types';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import { studentFullName } from '@/lib/school/students/constants';
import { DocumentSchoolHeader } from '@/components/documents/document-school-header';

type Props = {
  data: PaymentReceiptDocument;
};

function formatDocumentDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export function PaymentReceiptDocumentView({ data }: Props) {
  const studentName = studentFullName(
    data.student.last_name,
    data.student.first_name,
  );

  return (
    <div className="document-body space-y-6 text-sm text-black">
      <DocumentSchoolHeader school={data.school} subtitle="Reçu officiel" />

      <div className="text-center">
        <h2 className="text-base font-bold uppercase tracking-widest">
          Reçu de paiement
        </h2>
        <p className="mt-1 font-mono text-xs text-black/70">
          N° {data.payment.receipt_number}
        </p>
      </div>

      <dl className="document-grid grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-black/50">Date</dt>
          <dd className="font-medium">{formatDocumentDate(data.payment.created_at)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-black/50">
            Année scolaire
          </dt>
          <dd className="font-medium">{data.fee.academic_year}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-black/50">Élève</dt>
          <dd className="font-semibold uppercase">{studentName}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-black/50">Matricule</dt>
          <dd className="font-medium">{data.student.matricule ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-black/50">Classe</dt>
          <dd className="font-medium">{data.classLabel ?? '—'}</dd>
        </div>
        <div className="sm:col-span-2 rounded border border-black/15 bg-black/[0.02] px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-black/50">Motif</dt>
          <dd className="mt-0.5 font-medium">{data.fee.name}</dd>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-black/50">
                Montant dû
              </dt>
              <dd className="font-medium tabular-nums">
                {formatFeeAmount(data.fee.amount_due, data.payment.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-black/50">
                Déjà payé avant
              </dt>
              <dd className="font-medium tabular-nums">
                {formatFeeAmount(data.fee.total_paid_before, data.payment.currency)}
              </dd>
            </div> 
          </dl>
          <dt className="mt-3 text-xs uppercase tracking-wide text-black/50">
            Montant encaissé (ce versement)
          </dt>
          <dd className="mt-0.5 text-xl font-bold tabular-nums">
            {formatFeeAmount(data.payment.amount_paid, data.payment.currency)}
          </dd>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-black/50">
                Total payé à ce jour
              </dt>
              <dd className="font-semibold tabular-nums">
                {formatFeeAmount(data.fee.total_paid_after, data.payment.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-black/50">
                Reste à payer
              </dt>
              <dd
                className={`font-semibold tabular-nums ${
                  data.fee.amount_remaining > 0 ? 'text-black' : ''
                }`}
              >
                {data.fee.amount_remaining > 0
                  ? formatFeeAmount(data.fee.amount_remaining, data.payment.currency)
                  : 'Soldé'}
              </dd>
            </div>
          </dl>
        </div>
      </dl>

      <div className="document-signatures mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <div className="border-b border-black/30 pb-8" />
          <p className="mt-1 text-xs text-black/60">Signature du responsable</p>
        </div>
        <div>
          <div className="border-b border-black/30 pb-8" />
          <p className="mt-1 text-xs text-black/60">Signature du parent / tuteur</p>
        </div>
      </div>

      <p className="document-footer text-center text-xs text-black/50">
        Document généré par Pema Class — conservez ce reçu comme preuve de paiement.
      </p>
    </div>
  );
}
