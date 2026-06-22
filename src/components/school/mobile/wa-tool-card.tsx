import type { ComponentType } from 'react';
import { WorkspaceLink } from '@/components/school/mobile/workspace-link';
import { cn } from '@/lib/utils';

const TONE_CLASS = {
  green: 'bg-primary/10 text-primary',
  teal: 'bg-secondary/15 text-secondary',
  blue: 'bg-primary/10 text-primary-dark',
  orange: 'bg-orange-500/15 text-orange-700',
  indigo: 'bg-indigo-500/15 text-indigo-700',
  pink: 'bg-pink-500/15 text-pink-700',
};

type Props = {
  href: string;
  label: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  tone: keyof typeof TONE_CLASS;
};

export function WaToolCard({ href, label, description, icon: Icon, tone }: Props) {
  return (
    <WorkspaceLink
      href={href}
      className="flex flex-col gap-3 rounded-xl border border-wa-divider bg-wa-panel p-4 transition-colors hover:bg-wa-row-hover active:bg-wa-row-active"
    >
      <span
        className={cn(
          'flex size-11 items-center justify-center rounded-full',
          TONE_CLASS[tone],
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block text-sm font-medium text-wa-text-primary">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-snug text-wa-text-secondary">
            {description}
          </span>
        ) : null}
      </span>
    </WorkspaceLink>
  );
}
