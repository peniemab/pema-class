'use client';

import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import {
  SCHOOL_LOGOUT_ITEM,
  SCHOOL_TOOL_SECTIONS,
} from '@/lib/navigation/school-nav';
import { WaToolCard } from '@/components/school/mobile/wa-tool-card';
import { LogoutButton } from '@/components/auth/logout-button';
import { useAppData } from '@/lib/offline/app-data-context';
import { prefetchImpayesSnapshot } from '@/lib/offline/prefetch-impayes';
import { prefetchCashJournalSnapshot } from '@/lib/offline/prefetch-cash-journal';
import { prefetchEnrollmentSnapshot } from '@/lib/offline/prefetch-enrollment';

export function SchoolToolsPage() {
  const { schoolId } = useAppData();

  useEffect(() => {
    prefetchImpayesSnapshot(schoolId);
    prefetchCashJournalSnapshot(schoolId);
    prefetchEnrollmentSnapshot(schoolId);
  }, [schoolId]);

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <div className="space-y-6">
        {SCHOOL_TOOL_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 px-4 text-xs font-semibold uppercase tracking-wide text-wa-text-secondary">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-3">
              {section.items.map((item) => (
                <WaToolCard key={item.href + item.label} {...item} />
              ))}
            </div>
          </section>
        ))}

        <section className="px-4">
          <LogoutButton
            label={SCHOOL_LOGOUT_ITEM.label}
            className="flex min-h-[3.25rem] w-full items-center gap-3 rounded-xl border border-wa-divider bg-wa-panel px-4 text-left transition-colors hover:bg-wa-row-hover active:bg-wa-row-active"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <LogOut className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-destructive">
              {SCHOOL_LOGOUT_ITEM.label}
            </span>
          </LogoutButton>
        </section>
      </div>
    </div>
  );
}
