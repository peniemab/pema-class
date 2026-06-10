'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  CalendarRange,
  GraduationCap,
  IdCard,
  ImageIcon,
  Layers,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { AcademicYearSection } from '@/components/school/academic-year-section';
import { ClassesSection } from '@/components/school/classes-section';
import { FeesSection } from '@/components/school/fees-section';
import { InviteStaffForm } from '@/components/school/invite-staff-form';
import { SchoolCyclesSection } from '@/components/school/school-cycles-section';
import { SchoolLogoSection } from '@/components/school/school-logo-section';
import { SchoolSettingsForm } from '@/components/school/school-settings-form';
import { TeacherClassesForm } from '@/components/school/teacher-classes-form';
import { TeamPersonnelPanel } from '@/components/school/team-personnel-panel';
import {
  SettingsInset,
  SettingsLargeTitle,
  SettingsPanelGroup,
  SettingsRowButton,
  SettingsSheet,
  useSettingsHashSheet,
} from '@/components/school/settings-panel';
import type { ReferentialsPageData } from '@/lib/school/referentials-actions';
import {
  normalizeSchoolCycles,
  SCHOOL_CYCLE_LABELS,
} from '@/lib/school/referentials/constants';
import type { SchoolRow } from '@/lib/db/schools';
import type { TeamPageData } from '@/lib/db/team-page';
import { staffDisplayName } from '@/lib/platform/format';

const MAIN_SHEETS = ['etablissement', 'referentiels', 'equipe'] as const;

type SheetId =
  | (typeof MAIN_SHEETS)[number]
  | 'cycles'
  | 'annee'
  | 'classes'
  | 'frais'
  | 'logo'
  | 'equipe-invite'
  | 'equipe-personnel'
  | 'equipe-member';

type Props = {
  school: SchoolRow;
  referentials: ReferentialsPageData;
  team: TeamPageData;
};

export function ParametresScreen({ school, referentials, team }: Props) {
  const { activeSheet, openSheet } = useSettingsHashSheet([...MAIN_SHEETS]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const schoolLabel = school.display_name ?? school.name;
  const { activeYear, classes, fees } = referentials;
  const offeredCycles = useMemo(
    () => normalizeSchoolCycles(referentials.school.offered_cycles),
    [referentials.school.offered_cycles],
  );

  const cyclesDetail = offeredCycles
    .map((c) => SCHOOL_CYCLE_LABELS[c])
    .join(', ');

  const yearDetail = activeYear?.name ?? 'À configurer';
  const classesDetail = activeYear
    ? `${classes.length} classe${classes.length > 1 ? 's' : ''}`
    : '—';
  const feesDetail = activeYear ? `${fees.length} frais` : '—';
  const logoDetail = school.logo_url ? 'Défini' : 'Aucun';

  const referentialsSummary = activeYear
    ? `${activeYear.name} · ${classes.length} classe${classes.length > 1 ? 's' : ''}`
    : 'Année non configurée';

  const teamSummary =
    team.staff.length === 0
      ? 'Invitation'
      : `${team.staff.length} membre${team.staff.length > 1 ? 's' : ''}`;

  const personnelDetail =
    team.staff.length === 0
      ? 'Aucun membre'
      : `${team.staff.length} membre${team.staff.length > 1 ? 's' : ''}`;

  const selectedMember =
    team.staff.find((member) => member.id === selectedStaffId) ?? null;

  const warnYear = !activeYear ? 'text-amber-600 dark:text-amber-400' : undefined;

  function open(id: SheetId) {
    openSheet(id);
  }

  function closeSheet() {
    setSelectedStaffId(null);
    openSheet(null);
  }

  function backFromReferentialSub() {
    openSheet('referentiels');
  }

  function backToEquipe() {
    setSelectedStaffId(null);
    openSheet('equipe');
  }

  function backToPersonnel() {
    setSelectedStaffId(null);
    openSheet('equipe-personnel');
  }

  function openMember(staffId: string) {
    setSelectedStaffId(staffId);
    openSheet('equipe-member');
  }

  const sheetOpen = activeSheet !== null;

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-4 pb-8">
        <SettingsLargeTitle
          title="Paramètres"
          subtitle="Configuration de l'établissement"
        />

        <SettingsPanelGroup>
          <SettingsRowButton
            id="etablissement"
            icon={<Building2 aria-hidden />}
            iconTone="blue"
            label="Établissement"
            detail={schoolLabel}
            onClick={() => open('etablissement')}
          />
          <SettingsRowButton
            id="referentiels"
            icon={<BookOpen aria-hidden />}
            iconTone="green"
            label="Référentiels"
            detail={referentialsSummary}
            detailClassName={warnYear}
            onClick={() => open('referentiels')}
          />
          <SettingsRowButton
            id="equipe"
            icon={<Users aria-hidden />}
            iconTone="pink"
            label="Équipe"
            detail={teamSummary}
            onClick={() => open('equipe')}
          />
        </SettingsPanelGroup>
      </div>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'etablissement'}
        onOpenChange={(open) => !open && closeSheet()}
        title="Établissement"
      >
        <SchoolSettingsForm school={school} embedded />
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'referentiels'}
        onOpenChange={(open) => !open && closeSheet()}
        title="Référentiels"
      >
        <SettingsPanelGroup nested>
          <SettingsRowButton
            icon={<Layers aria-hidden />}
            iconTone="teal"
            label="Cycles offerts"
            detail={cyclesDetail || '—'}
            onClick={() => open('cycles')}
          />
          <SettingsRowButton
            icon={<CalendarRange aria-hidden />}
            iconTone="blue"
            label="Année scolaire"
            detail={yearDetail}
            detailClassName={warnYear}
            onClick={() => open('annee')}
          />
          <SettingsRowButton
            icon={<GraduationCap aria-hidden />}
            iconTone="orange"
            label="Classes"
            detail={classesDetail}
            onClick={() => open('classes')}
          />
          <SettingsRowButton
            icon={<Wallet aria-hidden />}
            iconTone="indigo"
            label="Frais scolaires"
            detail={feesDetail}
            onClick={() => open('frais')}
          />
          <SettingsRowButton
            icon={<ImageIcon aria-hidden />}
            iconTone="gray"
            label="Logo"
            detail={logoDetail}
            onClick={() => open('logo')}
          />
        </SettingsPanelGroup>
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'cycles'}
        onOpenChange={(open) => !open && closeSheet()}
        title="Cycles offerts"
        backLabel="Référentiels"
        onBack={backFromReferentialSub}
      >
        <SettingsInset>
          <SchoolCyclesSection school={referentials.school} />
        </SettingsInset>
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'annee'}
        onOpenChange={(open) => !open && closeSheet()}
        title="Année scolaire"
        backLabel="Référentiels"
        onBack={backFromReferentialSub}
      >
        <SettingsInset>
          <AcademicYearSection
            school={referentials.school}
            academicYears={referentials.academicYears}
            activeYear={referentials.activeYear}
            periods={referentials.periods}
          />
        </SettingsInset>
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'classes'}
        onOpenChange={(open) => !open && closeSheet()}
        title="Classes"
        backLabel="Référentiels"
        onBack={backFromReferentialSub}
      >
        <SettingsInset>
          <ClassesSection
            school={referentials.school}
            activeYear={referentials.activeYear}
            classes={referentials.classes}
          />
        </SettingsInset>
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'frais'}
        onOpenChange={(open) => !open && closeSheet()}
        title="Frais scolaires"
        backLabel="Référentiels"
        onBack={backFromReferentialSub}
      >
        <SettingsInset>
          <FeesSection activeYear={referentials.activeYear} fees={referentials.fees} />
        </SettingsInset>
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'logo'}
        onOpenChange={(open) => !open && closeSheet()}
        title="Logo"
        backLabel="Référentiels"
        onBack={backFromReferentialSub}
      >
        <SettingsInset>
          <SchoolLogoSection school={referentials.school} />
        </SettingsInset>
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'equipe'}
        onOpenChange={(open) => !open && closeSheet()}
        title="Équipe"
      >
        <SettingsPanelGroup nested>
          <SettingsRowButton
            icon={<UserPlus aria-hidden />}
            iconTone="pink"
            label="Inviter un collaborateur"
            detail="Lien d'invitation"
            onClick={() => open('equipe-invite')}
          />
          <SettingsRowButton
            icon={<IdCard aria-hidden />}
            iconTone="gray"
            label="Personnel"
            detail={personnelDetail}
            onClick={() => open('equipe-personnel')}
          />
        </SettingsPanelGroup>
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'equipe-invite'}
        onOpenChange={(open) => !open && backToEquipe()}
        title="Inviter un collaborateur"
        backLabel="Équipe"
        onBack={backToEquipe}
      >
        <InviteStaffForm
          embedded
          classes={team.classes}
          activeYearName={team.activeYear?.name ?? null}
          offeredCycles={offeredCycles}
        />
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'equipe-personnel'}
        onOpenChange={(open) => !open && backToEquipe()}
        title="Personnel"
        backLabel="Équipe"
        onBack={backToEquipe}
      >
        <TeamPersonnelPanel
          staff={team.staff}
          classes={team.classes}
          offeredCycles={offeredCycles}
          onSelectMember={openMember}
        />
      </SettingsSheet>

      <SettingsSheet
        open={sheetOpen && activeSheet === 'equipe-member' && selectedMember !== null}
        onOpenChange={(open) => !open && backToPersonnel()}
        title={selectedMember ? staffDisplayName(selectedMember) : 'Collaborateur'}
        backLabel="Personnel"
        onBack={backToPersonnel}
      >
        {selectedMember ? (
          <TeacherClassesForm
            member={selectedMember}
            classes={team.classes}
            activeYearName={team.activeYear?.name ?? null}
            offeredCycles={offeredCycles}
          />
        ) : null}
      </SettingsSheet>
    </>
  );
}
