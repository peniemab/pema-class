import { ClipboardCheck, LogOut, Wallet } from 'lucide-react';
import {
  ATTENDANCE_ROLES,
  FINANCE_ROLES,
  staffRoleLabel,
  type StaffRole,
} from '@/lib/auth/types';
import type { DashboardPageData } from '@/lib/db/dashboard-page';
import { APP_LOGOUT_ITEM } from '@/lib/navigation/app-nav';
import { WaBusinessProfileCard } from '@/components/school/mobile/wa-business-profile-card';
import {
  SettingsGroup,
  SettingsRow,
  SettingsScreen,
} from '@/components/school/settings-ui';
import { LogoutButton } from '@/components/auth/logout-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatFeeAmount } from '@/lib/school/referentials/constants';
import {
  formatDualMoney,
  type FeeCurrency,
} from '@/lib/school/fee-currencies';

type Props = {
  data: DashboardPageData;
  role: StaffRole;
};

function treasuryAmounts(data: DashboardPageData, currency: FeeCurrency) {
  if (currency === 'USD') {
    return {
      collected: data.totalCollectedUsd,
      expected: data.totalExpectedUsd,
      recovery: data.recoveryRateUsd,
    };
  }
  return {
    collected: data.totalCollectedCdf,
    expected: data.totalExpectedCdf,
    recovery: data.recoveryRateCdf,
  };
}

export function StaffDashboard({ data, role }: Props) {
  const canAttendance = ATTENDANCE_ROLES.includes(role);
  const canFinance = FINANCE_ROLES.includes(role);
  const currencies = data.feeCurrencies;
  const primaryCurrency = currencies[0] ?? 'CDF';
  const primary = treasuryAmounts(data, primaryCurrency);
  const recoveryPrimary = Math.min(100, Math.max(0, primary.recovery));

  return (
    <SettingsScreen className="max-w-3xl">
      <WaBusinessProfileCard
        schoolName={data.schoolName}
        activeYearName={data.activeYear?.name ?? null}
        enrolledCount={data.enrolledCount}
        classCount={data.classCount}
        feeCurrencies={currencies}
        totalCollectedCdf={data.totalCollectedCdf}
        totalCollectedUsd={data.totalCollectedUsd}
        studentsWithDebt={canFinance ? data.studentsWithDebt : 0}
        subtitle={`${staffRoleLabel(role)} · Pema Class`}
        showProfileLink={false}
        showTreasury={canFinance}
      />

      {!data.activeYear ? (
        <Alert className="mx-4">
          <AlertDescription>
            L&apos;année scolaire n&apos;est pas encore active. Contactez la
            direction de l&apos;établissement.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {canFinance && primary.collected > 0 ? (
            <div className="overflow-hidden border-y border-wa-divider bg-gradient-to-br from-primary/8 via-wa-panel to-wa-bg p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-wa-text-secondary">
                Trésorerie · {data.activeYear.name}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-secondary">
                {formatFeeAmount(primary.collected, primaryCurrency)}
              </p>
              <p className="text-sm text-wa-text-secondary">Total encaissé</p>
              {primary.expected > 0 ? (
                <div className="mt-4 space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-wa-bg">
                    <div
                      className="h-full rounded-full bg-secondary transition-all"
                      style={{ width: `${recoveryPrimary}%` }}
                    />
                  </div>
                  <p className="text-xs text-wa-text-secondary">
                    {Math.round(primary.recovery)} % recouvré ·{' '}
                    {formatFeeAmount(primary.expected, primaryCurrency)} attendu
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <SettingsGroup title="Mes modules">
            {canAttendance ? (
              <SettingsRow
                href="/app/presences"
                icon={<ClipboardCheck aria-hidden />}
                label="Présences"
                detail="Marquer les absences"
              />
            ) : null}
            {canFinance ? (
              <SettingsRow
                href="/app/caisse"
                icon={<Wallet aria-hidden />}
                label="Caisse"
                detail={formatDualMoney(
                  {
                    cdf: data.totalCollectedCdf,
                    usd: data.totalCollectedUsd,
                  },
                  currencies,
                )}
              />
            ) : null}
          </SettingsGroup>

          {canFinance ? (
            <SettingsGroup title="Effectifs">
              <SettingsRow
                href="/app/caisse"
                label="Élèves inscrits"
                detail={String(data.enrolledCount)}
              />
              <SettingsRow
                href="/app/caisse"
                label="Élèves avec impayé"
                detail={String(data.studentsWithDebt)}
                detailClassName={
                  data.studentsWithDebt > 0
                    ? 'text-destructive font-medium'
                    : undefined
                }
              />
            </SettingsGroup>
          ) : canAttendance ? (
            <SettingsGroup title="Établissement">
              <SettingsRow
                href="/app/presences"
                label="Élèves inscrits"
                detail={String(data.enrolledCount)}
              />
              <SettingsRow
                href="/app/presences"
                label="Classes"
                detail={String(data.classCount)}
              />
            </SettingsGroup>
          ) : null}
        </>
      )}

      <SettingsGroup>
        <div className="px-4 py-3">
          <LogoutButton
            label={APP_LOGOUT_ITEM.label}
            className="flex min-h-[3.25rem] w-full items-center gap-3 rounded-xl border border-wa-divider bg-wa-panel px-4 text-left transition-colors hover:bg-wa-row-hover active:bg-wa-row-active"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <LogOut className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-destructive">
              {APP_LOGOUT_ITEM.label}
            </span>
          </LogoutButton>
        </div>
      </SettingsGroup>
    </SettingsScreen>
  );
}
