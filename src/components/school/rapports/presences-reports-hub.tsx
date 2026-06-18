import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Repeat2,
  UserRound,
} from 'lucide-react';
import type { AttendanceReportData } from '@/lib/db/attendance-reports';
import {
  SettingsIcon,
  SettingsLargeTitle,
  SettingsPanelGroup,
} from '@/components/school/settings-panel';

import { SCHOOL_REPORTS_BASE, reportHref } from '@/lib/navigation/reports-paths';

type Props = {
  todayPreview: AttendanceReportData | null;
  reportsBase?: string;
};

export function PresencesReportsHub({
  todayPreview,
  reportsBase = SCHOOL_REPORTS_BASE,
}: Props) {
  const issues = todayPreview
    ? todayPreview.totals.absent +
      todayPreview.totals.late +
      todayPreview.totals.unmarked
    : 0;

  const items = [
    {
      href: reportHref(reportsBase, 'presences', 'jour'),
      icon: ClipboardList,
      tone: 'green' as const,
      label: 'Rapport du jour',
      description: 'Absences et retards pour une date',
      detail:
        todayPreview && todayPreview.totals.enrolled > 0
          ? issues === 0
            ? 'Tout est en ordre aujourd\'hui'
            : `${issues} alerte${issues > 1 ? 's' : ''} aujourd'hui`
          : 'Par date et classe',
    },
    {
      href: reportHref(reportsBase, 'presences', 'hebdo'),
      icon: CalendarDays,
      tone: 'blue' as const,
      label: 'Synthèse hebdomadaire',
      description: 'Taux de présence par classe sur la semaine',
      detail: 'Lun → dim',
    },
    {
      href: reportHref(reportsBase, 'presences', 'absences-repetees'),
      icon: Repeat2,
      tone: 'orange' as const,
      label: 'Absences répétées',
      description: 'Élèves absents plusieurs fois sur 7 ou 30 jours',
      detail: 'Suivi disciplinaire',
    },
    {
      href: reportHref(reportsBase, 'presences', 'eleve'),
      icon: UserRound,
      tone: 'indigo' as const,
      label: 'Historique élève',
      description: 'Journal de présence d\'un élève',
      detail: 'Par période',
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <SettingsLargeTitle
        title="Rapports présences"
        subtitle="Synthèses, listes et suivi individuel"
      />

      <SettingsPanelGroup>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex w-full min-h-[4.25rem] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted/70"
            >
              <SettingsIcon tone={item.tone}>
                <Icon aria-hidden />
              </SettingsIcon>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-medium leading-snug">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.description}
                </span>
                <span className="mt-1 block text-[0.6875rem] text-muted-foreground">
                  {item.detail}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground/50"
                aria-hidden
              />
            </Link>
          );
        })}
      </SettingsPanelGroup>
    </div>
  );
}
