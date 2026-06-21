import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-wa-divider/80', className)}
      aria-hidden
    />
  );
}

/** Barre sync (coin haut-droit) — placeholder discret. */
function SyncBarSkeleton() {
  return (
    <div className="no-print flex items-center justify-end px-4 py-2">
      <Bone className="h-7 w-28 rounded-full" />
    </div>
  );
}

/** 4 tuiles stats (présences). */
export function PresencesSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-4xl space-y-0"
      aria-busy="true"
      aria-label="Chargement des présences"
    >
      <SyncBarSkeleton />
      <div className="grid grid-cols-4 gap-px border-b border-wa-divider bg-wa-divider">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-wa-panel px-2 py-3 text-center sm:py-4">
            <Bone className="mx-auto h-7 w-10" />
            <Bone className="mx-auto mt-2 h-3 w-14" />
          </div>
        ))}
      </div>
      <div className="space-y-3 border-b border-wa-divider bg-wa-panel px-4 py-3">
        <Bone className="h-8 w-24 rounded-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Bone className="h-11 w-full rounded-lg" />
          <Bone className="h-11 w-full rounded-lg" />
        </div>
      </div>
      <ul className="divide-y divide-wa-divider border-b border-wa-divider bg-wa-panel">
        {[...Array(8)].map((_, i) => (
          <li
            key={i}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4"
          >
            <Bone className="size-5 rounded" />
            <div className="min-w-0 space-y-1.5">
              <Bone className="h-4 w-3/4 max-w-[12rem]" />
              <Bone className="h-3 w-20" />
            </div>
            <div className="flex gap-1">
              <Bone className="size-10 rounded-lg sm:size-8" />
              <Bone className="size-10 rounded-lg sm:size-8" />
              <Bone className="size-10 rounded-lg sm:size-8" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Annuaire élèves. */
export function StudentsSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-4xl space-y-0"
      aria-busy="true"
      aria-label="Chargement des élèves"
    >
      <SyncBarSkeleton />
      <div className="grid grid-cols-3 gap-px border-b border-wa-divider bg-wa-divider">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-wa-panel px-3 py-3">
            <Bone className="h-7 w-10" />
            <Bone className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-3 border-b border-wa-divider bg-wa-panel px-4 py-3">
        <Bone className="h-10 w-full rounded-lg" />
        <div className="grid gap-2 sm:grid-cols-2">
          <Bone className="h-10 w-full rounded-lg" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>
      </div>
      <ul className="divide-y divide-wa-divider bg-wa-panel">
        {[...Array(10)].map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <Bone className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Bone className="h-4 w-2/3 max-w-[14rem]" />
              <Bone className="h-3 w-24" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Accueil caisse. */
export function CaisseSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-2xl space-y-0"
      aria-busy="true"
      aria-label="Chargement de la caisse"
    >
      <SyncBarSkeleton />
      <div className="mx-4 mt-4 rounded-lg border-0 bg-wa-panel p-4">
        <div className="flex items-start gap-2">
          <Bone className="mt-0.5 size-4 shrink-0 rounded" />
          <Bone className="h-4 w-full max-w-md" />
        </div>
      </div>
      <div className="mt-4 border-y border-wa-divider bg-wa-panel px-4 py-4">
        <Bone className="mb-2 h-4 w-48" />
        <Bone className="h-10 w-full rounded-lg" />
        <Bone className="mt-3 h-3 w-56" />
      </div>
    </div>
  );
}
