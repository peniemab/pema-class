'use client';

import { Check, CloudOff, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncPhase } from '@/lib/offline/use-students-sync';

type Props = {
  phase: SyncPhase;
  online: boolean;
  lastSyncAt: string | null | undefined;
  onRefresh?: () => void;
  className?: string;
};

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'jamais';
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} j`;
}

export function SyncStatusBadge({
  phase,
  online,
  lastSyncAt,
  onRefresh,
  className,
}: Props) {
  let icon = <Check className="size-3.5" aria-hidden />;
  let label = `À jour · ${relativeTime(lastSyncAt)}`;
  let tone = 'text-wa-text-secondary';

  if (!online) {
    icon = <CloudOff className="size-3.5" aria-hidden />;
    label = `Hors ligne · ${relativeTime(lastSyncAt)}`;
    tone = 'text-amber-600';
  } else if (phase === 'syncing') {
    icon = <Loader2 className="size-3.5 animate-spin" aria-hidden />;
    label = 'Synchronisation…';
    tone = 'text-wa-accent';
  } else if (phase === 'error') {
    icon = <TriangleAlert className="size-3.5" aria-hidden />;
    label = 'Sync impossible';
    tone = 'text-destructive';
  }

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={phase === 'syncing'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium transition-colors hover:bg-black/5 disabled:cursor-default',
        tone,
        className,
      )}
      title="Actualiser maintenant"
    >
      {icon}
      <span>{label}</span>
      {online && phase !== 'syncing' ? (
        <RefreshCw className="size-3 opacity-50" aria-hidden />
      ) : null}
    </button>
  );
}
