import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { loadCaisseStudentPage } from '@/lib/school/payments-actions';
import { CaisseStudentPanel } from '@/components/school/caisse/caisse-student-panel';
import { EnrollmentPrintLink } from '@/components/documents/document-print-links';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';
import { ButtonLink } from '@/components/ui/button-link';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  studentId: string;
  caisseBasePath: '/school/caisse' | '/app/caisse';
  isNewEnrollment?: boolean;
};

export async function CaisseStudentPage({
  studentId,
  caisseBasePath,
  isNewEnrollment = false,
}: Props) {
  const data = await loadCaisseStudentPage(studentId, caisseBasePath);
  if (!data) notFound();

  const backHref = `${caisseBasePath}/${studentId}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <ButtonLink
          variant="ghost"
          size="sm"
          href={caisseBasePath}
          className="-ml-2 gap-1.5"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Caisse
        </ButtonLink>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {studentFullName(data.student.last_name, data.student.first_name)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Matricule {data.student.matricule ?? '—'}
              {data.enrollment
                ? ` · ${classDisplayLabel(
                    data.enrollment.class_level,
                    data.enrollment.class_name,
                  )}`
                : ''}
            </p>
          </div>
          {data.enrollment ? (
            <EnrollmentPrintLink
              studentId={data.student.id}
              backHref={backHref}
              autoPrint={isNewEnrollment}
            />
          ) : null}
        </div>
      </div>

      {isNewEnrollment && data.enrollment ? (
        <Alert className="border-primary/20 bg-primary/5">
          <AlertDescription className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              Inscription réussie. Imprimez la{' '}
              <strong>fiche d&apos;inscription</strong> pour le dossier, puis encaissez
              les frais ci-dessous.
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      {!data.activeYear ? (
        <Alert>
          <AlertDescription>
            Activez une année scolaire avant d&apos;encaisser des frais.
          </AlertDescription>
        </Alert>
      ) : !data.enrollment ? (
        <Alert variant="destructive">
          <AlertDescription>
            Cet élève n&apos;est pas inscrit pour {data.activeYear.name}.
          </AlertDescription>
        </Alert>
      ) : (
        <CaisseStudentPanel
          studentId={data.student.id}
          activeYearName={data.activeYear.name}
          balances={data.balances}
          payments={data.payments}
          scolariteSummary={data.scolariteSummary}
          caisseBasePath={caisseBasePath}
        />
      )}
    </div>
  );
}
