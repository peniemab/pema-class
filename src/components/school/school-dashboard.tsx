import Link from 'next/link';
import {
  CircleAlert,
  GraduationCap,
  Settings,
  Wallet,
} from 'lucide-react';
import type { DashboardPageData } from '@/lib/db/dashboard-page';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import {
  SettingsGroup,
  SettingsRow,
  SettingsScreen,
} from '@/components/school/settings-ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Props = {
  data: DashboardPageData;
};

function recoveryLabel(rate: number): string {
  return `${Math.round(rate)} %`;
}

export function SchoolDashboard({ data }: Props) {
  const hasUsd = data.totalExpectedUsd > 0 || data.totalCollectedUsd > 0;
  const recoveryCdf = Math.min(100, Math.max(0, data.recoveryRateCdf));
  const upToDate = data.enrolledCount - data.studentsWithDebt;

  return (
    <SettingsScreen className="max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.schoolName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.activeYear
            ? `Année scolaire ${data.activeYear.name}`
            : 'Configurez une année active pour commencer'}
        </p>
      </div>

      {!data.activeYear ? (
        <Alert>
          <AlertDescription>
            Activez une année scolaire dans{' '}
            <Link
              href="/school/parametres/referentiels"
              className="font-medium text-primary underline"
            >
              Paramètres → Référentiels
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/8 via-card to-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Trésorerie · {data.activeYear.name}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-secondary">
              {formatFeeAmount(data.totalCollectedCdf, 'CDF')}
            </p>
            <p className="text-sm text-muted-foreground">Total encaissé</p>

            {data.totalExpectedCdf > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${recoveryCdf}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{recoveryLabel(data.recoveryRateCdf)} recouvré</span>
                  <span>
                    {formatFeeAmount(data.totalExpectedCdf, 'CDF')} attendu
                  </span>
                </div>
              </div>
            ) : null}

            {hasUsd ? (
              <p className="mt-3 text-sm tabular-nums text-muted-foreground">
                {formatFeeAmount(data.totalCollectedUsd, 'USD')} encaissé USD
                {data.totalExpectedUsd > 0
                  ? ` · ${recoveryLabel(data.recoveryRateUsd)} recouvré`
                  : ''}
              </p>
            ) : null}
          </div>

          <SettingsGroup title="Finances">
            <SettingsRow
              href="/school/impayes"
              icon={<CircleAlert aria-hidden />}
              label="Impayés"
              detail={formatFeeAmount(data.totalUnpaidCdf, 'CDF')}
              detailClassName="text-destructive font-medium"
            />
            <SettingsRow
              href="/school/caisse"
              icon={<Wallet aria-hidden />}
              label="Caisse"
              detail="Encaisser"
            />
          </SettingsGroup>

          <SettingsGroup title="Effectifs">
            <SettingsRow
              href="/school/eleves"
              icon={<GraduationCap aria-hidden />}
              label="Élèves inscrits"
              detail={String(data.enrolledCount)}
            />
            <SettingsRow
              href="/school/impayes"
              label="Élèves avec impayé"
              detail={String(data.studentsWithDebt)}
              detailClassName={cn(
                data.studentsWithDebt > 0 && 'text-destructive font-medium',
              )}
            />
            <SettingsRow
              href="/school/eleves"
              label="Élèves à jour"
              detail={String(upToDate)}
              detailClassName="text-emerald-600 dark:text-emerald-400 font-medium"
            />
          </SettingsGroup>

          <SettingsGroup title="Configuration">
            <SettingsRow
              href="/school/parametres"
              icon={<Settings aria-hidden />}
              label="Paramètres"
              detail={`${data.classCount} classe${data.classCount > 1 ? 's' : ''}`}
            />
          </SettingsGroup>
        </>
      )}
    </SettingsScreen>
  );
}
