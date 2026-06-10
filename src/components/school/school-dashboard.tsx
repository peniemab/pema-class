import Link from 'next/link';
import {
  CircleAlert,
  GraduationCap,
  Settings,
  Wallet,
} from 'lucide-react';
import type { DashboardPageData } from '@/lib/db/dashboard-page';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import { WaBusinessProfileCard } from '@/components/school/mobile/wa-business-profile-card';
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
    <SettingsScreen className="max-w-3xl">
      <WaBusinessProfileCard
        schoolName={data.schoolName}
        activeYearName={data.activeYear?.name ?? null}
        enrolledCount={data.enrolledCount}
        classCount={data.classCount}
        totalCollectedCdf={data.totalCollectedCdf}
        studentsWithDebt={data.studentsWithDebt}
      />

      {!data.activeYear ? (
        <Alert className="mx-4">
          <AlertDescription>
            Activez une année scolaire dans{' '}
            <Link
              href="/school/parametres#referentiels"
              className="font-medium text-wa-accent underline"
            >
              Paramètres → Référentiels
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="overflow-hidden border-y border-wa-divider bg-gradient-to-br from-primary/8 via-wa-panel to-wa-bg p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-wa-text-secondary">
              Trésorerie · {data.activeYear.name}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-secondary">
              {formatFeeAmount(data.totalCollectedCdf, 'CDF')}
            </p>
            <p className="text-sm text-wa-text-secondary">Total encaissé</p>

            {data.totalExpectedCdf > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-wa-bg">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${recoveryCdf}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-wa-text-secondary">
                  <span>{recoveryLabel(data.recoveryRateCdf)} recouvré</span>
                  <span>{formatFeeAmount(data.totalExpectedCdf, 'CDF')} attendu</span>
                </div>
              </div>
            ) : null}

            {hasUsd ? (
              <p className="mt-3 text-sm tabular-nums text-wa-text-secondary">
                {formatFeeAmount(data.totalCollectedUsd, 'USD')} encaissé USD
                {data.totalExpectedUsd > 0
                  ? ` · ${recoveryLabel(data.recoveryRateUsd)} recouvré`
                  : ''}
              </p>
            ) : null}
          </div>

          <SettingsGroup title="Raccourcis">
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
            <SettingsRow
              href="/school/outils"
              icon={<Settings aria-hidden />}
              label="Outils"
              detail="Rapports & admin"
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
              detailClassName="text-emerald-600 font-medium"
            />
          </SettingsGroup>
        </>
      )}
    </SettingsScreen>
  );
}
