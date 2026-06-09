import { Skeleton } from '@/components/ui/skeleton';

export default function CaisseLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-36 rounded-lg" />
    </div>
  );
}
