'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export type SettingsIconTone =
  | 'blue'
  | 'green'
  | 'orange'
  | 'indigo'
  | 'pink'
  | 'gray'
  | 'teal';

const ICON_TONE_CLASS: Record<SettingsIconTone, string> = {
  blue: 'bg-blue-500 text-white shadow-sm shadow-blue-500/25',
  green: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25',
  orange: 'bg-orange-500 text-white shadow-sm shadow-orange-500/25',
  indigo: 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/25',
  pink: 'bg-pink-500 text-white shadow-sm shadow-pink-500/25',
  gray: 'bg-zinc-500 text-white shadow-sm shadow-zinc-500/25',
  teal: 'bg-teal-500 text-white shadow-sm shadow-teal-500/25',
};

export function SettingsIcon({
  tone,
  children,
  className,
}: {
  tone: SettingsIconTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex size-[1.875rem] shrink-0 items-center justify-center rounded-[7px] [&>svg]:size-4',
        ICON_TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SettingsLargeTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="space-y-1 px-4 md:px-1">
      <h1 className="hidden text-[1.75rem] font-bold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function SettingsGroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function SettingsFootnote({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
      {children}
    </p>
  );
}

/** Adoucit les cartes imbriquées dans un panneau Réglages. */
export function SettingsInset({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        '[&_[data-slot=card]]:rounded-lg [&_[data-slot=card]]:bg-background/90',
        '[&_[data-slot=card]]:py-3 [&_[data-slot=card]]:shadow-none [&_[data-slot=card]]:ring-0',
        '[&_[data-slot=card-header]]:px-3 [&_[data-slot=card-content]]:px-3',
      )}
    >
      {children}
    </div>
  );
}

type SettingsRowButtonProps = {
  id?: string;
  icon: ReactNode;
  iconTone: SettingsIconTone;
  label: string;
  detail?: string;
  detailClassName?: string;
  onClick: () => void;
};

/** Ligne style Réglages iOS — ouvre une sheet au tap. */
export function SettingsRowButton({
  id,
  icon,
  iconTone,
  label,
  detail,
  detailClassName,
  onClick,
}: SettingsRowButtonProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className="flex w-full min-h-[3.25rem] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-wa-row-hover active:bg-wa-row-active md:hover:bg-muted/50 md:active:bg-muted/70"
    >
      <SettingsIcon tone={iconTone}>{icon}</SettingsIcon>
      <span className="min-w-0 flex-1 text-[0.9375rem] font-normal leading-snug">
        {label}
      </span>
      {detail ? (
        <span
          className={cn(
            'max-w-[42%] truncate text-[0.9375rem] text-muted-foreground',
            detailClassName,
          )}
        >
          {detail}
        </span>
      ) : null}
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/50"
        aria-hidden
      />
    </button>
  );
}

type SettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  backLabel?: string;
  onBack?: () => void;
  children: ReactNode;
};

/** Panneau latéral pour éditer un réglage (équivalent écran iOS). */
export function SettingsSheet({
  open,
  onOpenChange,
  title,
  backLabel = 'Paramètres',
  onBack,
  children,
}: SettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={!onBack}
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-3 pr-12">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-1 inline-flex text-sm font-medium text-primary hover:underline"
            >
              ‹ {backLabel}
            </button>
          ) : null}
          <SheetTitle className="text-lg">{title}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

type SettingsPanelGroupProps = {
  label?: string;
  footnote?: string;
  children: ReactNode;
  className?: string;
  nested?: boolean;
};

export function SettingsPanelGroup({
  label,
  footnote,
  children,
  className,
  nested = false,
}: SettingsPanelGroupProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label ? <SettingsGroupLabel>{label}</SettingsGroupLabel> : null}
      <div
        className={cn(
          'overflow-hidden divide-y divide-wa-divider md:divide-border/80',
          nested
            ? 'rounded-lg bg-muted/30'
            : 'border-y border-wa-divider bg-wa-panel',
        )}
      >
        {children}
      </div>
      {footnote ? <SettingsFootnote>{footnote}</SettingsFootnote> : null}
    </div>
  );
}

/** Ouvre la sheet correspondant au hash (#etablissement, #referentiels, #equipe). */
export function useSettingsHashSheet(sections: readonly string[]) {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace('#', '');
      if (sections.includes(hash)) {
        setActiveSheet(hash);
      }
    }

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [sections]);

  function openSheet(section: string | null) {
    setActiveSheet(section);
    const url = section
      ? `${window.location.pathname}#${section}`
      : window.location.pathname;
    window.history.replaceState(null, '', url);
  }

  return { activeSheet, openSheet, setActiveSheet: openSheet };
}
