import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  href?: string;
  onClick?: () => void;
  avatar: ReactNode;
  title: string;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  badge?: ReactNode;
  className?: string;
};

export function WaListRow({
  href,
  onClick,
  avatar,
  title,
  subtitle,
  trailing,
  badge,
  className,
}: Props) {
  const content = (
    <>
      {avatar}
      <span className="min-w-0 flex-1 border-b border-wa-divider py-3 pr-4 group-last:border-b-0">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[1rem] font-normal text-wa-text-primary">
              {title}
            </span>
            {subtitle ? (
              <span className="mt-0.5 block text-sm text-wa-text-secondary">
                {typeof subtitle === 'string' ? (
                  <span className="block truncate">{subtitle}</span>
                ) : (
                  subtitle
                )}
              </span>
            ) : null}
          </span>
          {(trailing || badge) && (
            <span className="flex shrink-0 flex-col items-end gap-1">
              {trailing}
              {badge}
            </span>
          )}
        </span>
      </span>
    </>
  );

  const rowClass = cn(
    'group flex w-full items-center gap-3 pl-4 text-left transition-colors',
    'hover:bg-wa-row-hover active:bg-wa-row-active',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={rowClass}>
      {content}
    </button>
  );
}

export function WaList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-wa-panel divide-y-0', className)}>
      {children}
    </div>
  );
}

export function WaListSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-2">
      {title ? (
        <p className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-wa-text-secondary">
          {title}
        </p>
      ) : null}
      <div className="overflow-hidden bg-wa-panel">{children}</div>
    </section>
  );
}
