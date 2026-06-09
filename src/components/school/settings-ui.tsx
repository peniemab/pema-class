import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsGroupProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function SettingsGroup({ title, children, className }: SettingsGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {title ? (
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-xl border bg-card divide-y">{children}</div>
    </div>
  );
}

type SettingsRowProps = {
  href: string;
  icon?: React.ReactNode;
  label: string;
  detail?: string;
  detailClassName?: string;
  showChevron?: boolean;
};

export function SettingsRow({
  href,
  icon,
  label,
  detail,
  detailClassName,
  showChevron = true,
}: SettingsRowProps) {
  return (
    <Link
      href={href}
      className="flex min-h-[52px] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 active:bg-muted/60"
    >
      {icon ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:size-4">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      {detail ? (
        <span
          className={cn(
            'max-w-[45%] truncate text-sm text-muted-foreground tabular-nums',
            detailClassName,
          )}
        >
          {detail}
        </span>
      ) : null}
      {showChevron ? (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
      ) : null}
    </Link>
  );
}

type SettingsPageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export function SettingsPageHeader({
  title,
  description,
  backHref = '/school/parametres',
  backLabel = 'Paramètres',
}: SettingsPageHeaderProps) {
  return (
    <div className="space-y-1">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          ‹ {backLabel}
        </Link>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function SettingsScreen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-2xl space-y-6 pb-8', className)}>{children}</div>
  );
}
