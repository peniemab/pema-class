import { WorkspaceLink } from '@/components/school/mobile/workspace-link';
import {
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  CircleAlert,
  Wallet,
} from 'lucide-react';
import {
  SettingsIcon,
  SettingsLargeTitle,
  SettingsPanelGroup,
} from '@/components/school/settings-panel';
import { formatDualMoney, type FeeCurrency } from '@/lib/school/fee-currencies';
import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';
import { cn } from '@/lib/utils';

type Preview = {
  presencesIssues: number | null;
  feeCurrencies: FeeCurrency[];
  cashTodayCdf: number | null;
  cashTodayUsd: number | null;
  cashTodayCount: number | null;
  studentsWithDebt: number | null;
  totalEnrolled: number | null;
};

type Props = {
  preview: Preview;
  reportsBase?: string;
};

function buildSections(base: string) {
  return [
  {
    href: reportHref(base, 'presences'),
    icon: ClipboardCheck,
    tone: 'green' as const,
    label: 'Présences',
    description: 'Jour, hebdo, absences répétées, historique élève',
    badge: (p: Preview) => {
      if (p.presencesIssues === null) return null;
      if (p.presencesIssues === 0) return 'Tout est en ordre aujourd\'hui';
      return `${p.presencesIssues} alerte${p.presencesIssues > 1 ? 's' : ''} aujourd'hui`;
    },
    badgeTone: (p: Preview) =>
      p.presencesIssues === null
        ? 'muted'
        : p.presencesIssues === 0
          ? 'success'
          : 'danger',
  },
  {
    href: reportHref(base, 'caisse'),
    icon: Wallet,
    tone: 'indigo' as const,
    label: 'Caisse',
    description: 'Journal des encaissements',
    badge: (p: Preview) => {
      if (p.cashTodayCount === null) return null;
      if (p.cashTodayCount === 0) return 'Aucun encaissement aujourd\'hui';
      const total = formatDualMoney(
        { cdf: p.cashTodayCdf ?? 0, usd: p.cashTodayUsd ?? 0 },
        p.feeCurrencies,
        { skipZero: false },
      );
      return `${p.cashTodayCount} encaissement${p.cashTodayCount > 1 ? 's' : ''} · ${total}`;
    },
    badgeTone: () => 'neutral' as const,
  },
  {
    href: reportHref(base, 'impayes'),
    icon: CircleAlert,
    tone: 'orange' as const,
    label: 'Impayés',
    description: 'Synthèse et liste des élèves en dette',
    badge: (p: Preview) => {
      if (p.studentsWithDebt === null) return null;
      if (p.studentsWithDebt === 0) return 'Tous les élèves sont à jour';
      return `${p.studentsWithDebt} élève${p.studentsWithDebt > 1 ? 's' : ''} en dette`;
    },
    badgeTone: (p: Preview) =>
      p.studentsWithDebt === null
        ? 'muted'
        : p.studentsWithDebt === 0
          ? 'success'
          : 'danger',
  },
  {
    href: reportHref(base, 'effectifs'),
    icon: GraduationCap,
    tone: 'blue' as const,
    label: 'Effectifs',
    description: 'Inscrits par classe et par cycle',
    badge: (p: Preview) =>
      p.totalEnrolled === null
        ? null
        : `${p.totalEnrolled} inscrit${p.totalEnrolled > 1 ? 's' : ''}`,
    badgeTone: () => 'neutral' as const,
  },
];
}

export function RapportsHub({
  preview,
  reportsBase = SCHOOL_REPORTS_BASE,
}: Props) {
  const sections = buildSections(reportsBase);
  return (
    <div className="mx-auto w-full max-w-2xl space-y-2 pb-8">
      <SettingsLargeTitle
        title="Rapports"
        subtitle="Synthèses et listes à imprimer"
      />

      <SettingsPanelGroup>
        {sections.map((section) => {
          const Icon = section.icon;
          const badge = section.badge(preview);
          const badgeTone = section.badgeTone(preview);
          return (
            <WorkspaceLink
              key={section.href}
              href={section.href}
              className="flex w-full min-h-[4.25rem] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-wa-row-hover active:bg-wa-row-active"
            >
              <SettingsIcon tone={section.tone}>
                <Icon aria-hidden />
              </SettingsIcon>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-medium leading-snug">
                  {section.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {section.description}
                </span>
                {badge ? (
                  <span
                    className={cn(
                      'mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[0.6875rem] font-medium',
                      badgeTone === 'success' &&
                        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                      badgeTone === 'danger' && 'bg-destructive/10 text-destructive',
                      badgeTone === 'neutral' && 'bg-primary/10 text-primary',
                      badgeTone === 'muted' && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground/50"
                aria-hidden
              />
            </WorkspaceLink>
          );
        })}
      </SettingsPanelGroup>
    </div>
  );
}
