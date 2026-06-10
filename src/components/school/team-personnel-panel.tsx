'use client';

import { User } from 'lucide-react';
import type { TeamStaffRow } from '@/lib/db/team-page';
import type { ClassRow } from '@/lib/db/classes';
import type { SchoolCycle } from '@/lib/school/referentials/constants';
import {
  buildPersonnelSections,
  memberDetail,
} from '@/lib/school/team-grouping';
import { staffDisplayName } from '@/lib/platform/format';
import {
  SettingsGroupLabel,
  SettingsPanelGroup,
  SettingsRowButton,
} from '@/components/school/settings-panel';

type Props = {
  staff: TeamStaffRow[];
  classes: ClassRow[];
  offeredCycles: SchoolCycle[];
  onSelectMember: (staffId: string) => void;
};

export function TeamPersonnelPanel({
  staff,
  classes,
  offeredCycles,
  onSelectMember,
}: Props) {
  const sections = buildPersonnelSections(staff, classes, offeredCycles);

  if (staff.length === 0) {
    return (
      <p className="px-1 text-sm text-muted-foreground">
        Aucun membre pour le moment. Invitez un collaborateur pour commencer.
      </p>
    );
  }

  if (sections.length === 0) {
    return (
      <p className="px-1 text-sm text-muted-foreground">
        Aucun enseignant ni collaborateur à afficher.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.id} className="space-y-1">
          <SettingsGroupLabel>{section.label}</SettingsGroupLabel>
          <SettingsPanelGroup nested>
            {section.members.map((member) => (
              <SettingsRowButton
                key={`${section.id}-${member.id}`}
                icon={<User aria-hidden />}
                iconTone="gray"
                label={staffDisplayName(member)}
                detail={memberDetail(member)}
                onClick={() => onSelectMember(member.id)}
              />
            ))}
          </SettingsPanelGroup>
        </div>
      ))}
    </div>
  );
}
