import { Skeleton } from '@/components/ui/skeleton';

function SectionSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export default function ReferentielsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
}
