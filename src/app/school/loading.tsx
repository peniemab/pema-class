import { Skeleton } from '@/components/ui/skeleton';

export default function SchoolLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
    </div>
  );
}
