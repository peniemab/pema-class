'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { CaisseStudentPanel } from '@/components/school/caisse/caisse-student-panel';
import { SyncStatusBadge } from '@/components/offline/sync-status-badge';
import { EnrollmentPrintLink } from '@/components/documents/document-print-links';
import { ButtonLink } from '@/components/ui/button-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { saveCaisseSnapshot } from '@/lib/offline/caisse-repo';
import { pushOutbox } from '@/lib/offline/push-outbox';
import { recordPaymentLocally } from '@/lib/offline/pay-local';
import { useCaisseSync } from '@/lib/offline/use-caisse-sync';
import { useCaisseStudent } from '@/lib/offline/use-caisse-student';
import type { CaisseSnapshot } from '@/lib/offline/caisse-snapshot';
import {
  classDisplayLabel,
  studentFullName,
} from '@/lib/school/students/constants';

type Props = {
  schoolId: string;
  studentId: string;
  caisseBasePath: '/school/caisse' | '/app/caisse';
  isNewEnrollment?: boolean;
  initialSnapshot: CaisseSnapshot | null;
};

export function OfflineCaisseStudentView({
  schoolId,
  studentId,
  caisseBasePath,
  isNewEnrollment = false,
  initialSnapshot,
}: Props) {
  const { state, phase, online, pendingCount, refresh } =
    useCaisseSync(schoolId);
  const {
    student,
    activeYear,
    balances,
    payments,
    scolariteSummary,
    pendingPaymentIds,
    loading,
  } = useCaisseStudent(schoolId, studentId);

  useEffect(() => {
    if (initialSnapshot) {
      void saveCaisseSnapshot(initialSnapshot);
    }
  }, [initialSnapshot]);

  const yearName =
    activeYear?.name ?? initialSnapshot?.activeYear?.name ?? null;
  const backHref = `${caisseBasePath}/${studentId}`;

  async function handleRecordPayment(input: {
    feeId: string;
    amount: number;
  }) {
    const result = await recordPaymentLocally({
      schoolId,
      studentId,
      feeId: input.feeId,
      amount: input.amount,
    });
    if (!result.ok) return result;

    if (online) {
      try {
        await pushOutbox(schoolId);
        refresh();
      } catch {
        // Enregistrement local OK.
      }
    }

    return {
      ok: true as const,
      paymentId: result.paymentId,
      receiptNumber: result.receiptNumber,
      amountPaid: result.amountPaid,
      currency: result.currency,
      feeName: result.feeName,
      amountRemaining: result.amountRemaining,
      pendingSync: result.pendingSync,
    };
  }

  if (loading) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Chargement…
      </p>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Alert>
          <AlertDescription>
            Élève introuvable dans le cache local.{' '}
            <Link href={caisseBasePath} className="font-medium underline">
              Retour caisse
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print flex items-center justify-end">
        <SyncStatusBadge
          phase={phase}
          online={online}
          lastSyncAt={state?.lastSyncAt}
          pendingCount={pendingCount}
          onRefresh={refresh}
        />
      </div>

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
              {studentFullName(student.last_name, student.first_name)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Matricule {student.matricule ?? '—'}
              {student.class_id
                ? ` · ${classDisplayLabel(student.class_level, student.class_name)}`
                : ''}
            </p>
          </div>
          {student.class_id && online && student.sync_status === 'synced' ? (
            <EnrollmentPrintLink
              studentId={student.id}
              backHref={backHref}
              autoPrint={isNewEnrollment}
            />
          ) : null}
        </div>
      </div>

      {isNewEnrollment && student.class_id ? (
        <Alert className="border-primary/20 bg-primary/5">
          <AlertDescription className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              Inscription enregistrée. Encaissez les frais ci-dessous
              {student.sync_status === 'pending'
                ? ' (synchronisation en arrière-plan).'
                : '.'}
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      {!yearName ? (
        <Alert>
          <AlertDescription>
            Activez une année scolaire avant d&apos;encaisser des frais.
          </AlertDescription>
        </Alert>
      ) : !student.class_id ? (
        <Alert variant="destructive">
          <AlertDescription>
            Cet élève n&apos;est pas inscrit pour {yearName}.
          </AlertDescription>
        </Alert>
      ) : (
        <CaisseStudentPanel
          studentId={student.id}
          activeYearName={yearName}
          balances={balances}
          payments={payments}
          scolariteSummary={scolariteSummary}
          caisseBasePath={caisseBasePath}
          onRecordPayment={handleRecordPayment}
          pendingPaymentIds={pendingPaymentIds}
        />
      )}
    </div>
  );
}
